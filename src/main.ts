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

// Get canvas context
const ctx = drawingCanvas.getContext('2d');
if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

// MarkerLine class to represent each line drawn on the canvas
class MarkerLine {
    points: { x: number, y: number }[];

    constructor(x: number, y: number) {
        this.points = [{ x, y }];
    }

    // Adds a new point to the line as the user drags
    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    // Displays the line on the canvas
    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length > 1) {
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.strokeStyle = "black";

            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (const point of this.points) {
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
            ctx.closePath();
        }
    }
}

// Arrays to store marker lines and redo stack
let strokes: MarkerLine[] = [];
let redoStack: MarkerLine[] = [];
let currentStroke: MarkerLine | null = null;
let drawing = false;

// Handle mouse down event
drawingCanvas.addEventListener('mousedown', (e) => {
    drawing = true;
    currentStroke = new MarkerLine(e.offsetX, e.offsetY);
    redoStack = []; 
});

// Handle mouse move event
drawingCanvas.addEventListener('mousemove', (e) => {
    if (drawing && currentStroke) {
        currentStroke.drag(e.offsetX, e.offsetY);
        dispatchDrawingChangedEvent(); 
    }
});

// Handle mouse up event
drawingCanvas.addEventListener('mouseup', () => {
    if (drawing && currentStroke) {
        strokes.push(currentStroke); 
        drawing = false;
        currentStroke = null;
        dispatchDrawingChangedEvent(); 
    }
});

// Handle mouse out event
drawingCanvas.addEventListener('mouseout', () => {
    if (drawing && currentStroke) {
        strokes.push(currentStroke); 
        drawing = false;
        currentStroke = null;
        dispatchDrawingChangedEvent(); 
    }
});

// Dispatch custom "drawing-changed" event
const dispatchDrawingChangedEvent = () => {
    const event = new CustomEvent("drawing-changed");
    drawingCanvas.dispatchEvent(event); // Dispatch the custom event
};

// Event listener for "drawing-changed" event to clear and redraw
drawingCanvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

// Function to redraw the canvas based on the saved marker lines
const redrawCanvas = () => {
    if (ctx) {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        for (const stroke of strokes) {
            stroke.display(ctx);
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
