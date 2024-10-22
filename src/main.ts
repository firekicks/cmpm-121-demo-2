import "./style.css";

const APP_NAME = "Hello, this is Atri!";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

app.innerHTML = ""; 

// Create title
const appTitle = document.createElement('h1');
appTitle.textContent = APP_NAME;

// Create canvas
const drawingCanvas = document.createElement('canvas');
drawingCanvas.width = 256;
drawingCanvas.height = 256;
drawingCanvas.id = "myCanvas";

// Create buttons
const clearButton = document.createElement('button');
clearButton.textContent = "Clear Canvas";
clearButton.id = "clearButton";

const undoButton = document.createElement('button');
undoButton.textContent = "Undo";
undoButton.id = "undoButton";

const redoButton = document.createElement('button');
redoButton.textContent = "Redo";
redoButton.id = "redoButton";

// Append elements to app
app.appendChild(appTitle);
app.appendChild(drawingCanvas);
app.appendChild(clearButton);
app.appendChild(undoButton);
app.appendChild(redoButton);

const ctx = drawingCanvas.getContext('2d');
if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

// Arrays for storing strokes and redo stack
let strokes: { x: number, y: number }[][] = [];
let redoStack: { x: number, y: number }[][] = [];
let currentStroke: { x: number, y: number }[] = [];
let drawing = false;

// Handle mouse down event
drawingCanvas.addEventListener('mousedown', (e) => {
    drawing = true;
    currentStroke = []; 
    addPoint(e); 
    redoStack = []; 
});

// Handle mouse move event
drawingCanvas.addEventListener('mousemove', (e) => {
    if (drawing) {
        addPoint(e); 
    }
});

// Handle mouse up event
drawingCanvas.addEventListener('mouseup', () => {
    if (drawing) {
        strokes.push(currentStroke); 
        drawing = false;
        dispatchDrawingChangedEvent(); 
    }
});

// Handle mouse out event
drawingCanvas.addEventListener('mouseout', () => {
    if (drawing) {
        strokes.push(currentStroke); 
        drawing = false;
        dispatchDrawingChangedEvent(); 
    }
});

// Function to add a point to the current stroke
const addPoint = (e: MouseEvent) => {
    currentStroke.push({ x: e.offsetX, y: e.offsetY });
    dispatchDrawingChangedEvent(); 
};

// Dispatch custom "drawing-changed" event
const dispatchDrawingChangedEvent = () => {
    const event = new CustomEvent("drawing-changed");
    drawingCanvas.dispatchEvent(event); // Dispatch the custom event
};

// Event listener for "drawing-changed" event to clear and redraw
drawingCanvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

// Function to redraw the canvas based on the saved strokes
const redrawCanvas = () => {
    if (ctx) {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "black";

        for (const stroke of strokes) {
            if (stroke.length > 0) {
                ctx.beginPath();
                ctx.moveTo(stroke[0].x, stroke[0].y);
                for (const point of stroke) {
                    ctx.lineTo(point.x, point.y);
                }
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
};

// Undo function to pop the most recent stroke and add it to the redo stack
const undo = () => {
    if (strokes.length > 0) {
        const lastStroke = strokes.pop(); 
        if (lastStroke) redoStack.push(lastStroke);
        dispatchDrawingChangedEvent(); 
    }
};

// Redo function to pop the most recent stroke from the redo stack and add it to strokes
const redo = () => {
    if (redoStack.length > 0) {
        const lastRedoStroke = redoStack.pop(); 
        if (lastRedoStroke) strokes.push(lastRedoStroke); 
        dispatchDrawingChangedEvent(); 
    }
};

// Clear canvas when button is clicked
clearButton.addEventListener('click', () => {
    strokes = []; 
    redoStack = []; 
    dispatchDrawingChangedEvent(); 
});

// Undo button functionality
undoButton.addEventListener('click', () => {
    undo(); 
});

// Redo button functionality
redoButton.addEventListener('click', () => {
    redo(); 
});
