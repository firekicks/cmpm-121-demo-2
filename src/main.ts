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

// Create buttons for tools
const clearButton = document.createElement('button');
clearButton.textContent = "Clear Canvas";
clearButton.id = "clearButton";

const undoButton = document.createElement('button');
undoButton.textContent = "Undo";
undoButton.id = "undoButton";

const redoButton = document.createElement('button');
redoButton.textContent = "Redo";
redoButton.id = "redoButton";

const thinButton = document.createElement('button');
thinButton.textContent = "Thin Marker";
thinButton.id = "thinButton";

const thickButton = document.createElement('button');
thickButton.textContent = "Thick Marker";
thickButton.id = "thickButton";

// Append elements to app
app.appendChild(appTitle);
app.appendChild(drawingCanvas);
app.appendChild(clearButton);
app.appendChild(undoButton);
app.appendChild(redoButton);
app.appendChild(thinButton);
app.appendChild(thickButton);

// Get canvas context
const ctx = drawingCanvas.getContext('2d');
if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

class MarkerLine {
    points: { x: number, y: number }[];
    thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.points = [{ x, y }];
        this.thickness = thickness;
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length > 1) {
            ctx.lineWidth = this.thickness;
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

class ToolPreview {
    x: number;
    y: number;
    thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "gray";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

// Arrays to store marker lines and redo stack
let strokes: MarkerLine[] = [];
let redoStack: MarkerLine[] = [];
let currentStroke: MarkerLine | null = null;
let drawing = false;

// Variable to track the current tool (default to thin marker)
let currentThickness = 2;
let toolPreview: ToolPreview | null = null; 

// Function to set the selected tool (marker thickness)
const setTool = (thickness: number) => {
    currentThickness = thickness;
    document.querySelectorAll('button').forEach(button => {
        button.classList.remove('selectedTool');
    });
    if (thickness === 2) {
        thinButton.classList.add('selectedTool'); 
    } else if (thickness === 6) {
        thickButton.classList.add('selectedTool');
    }
};

// Set default tool to thin
setTool(2);

drawingCanvas.addEventListener('mousedown', (e) => {
    drawing = true;
    currentStroke = new MarkerLine(e.offsetX, e.offsetY, currentThickness); 
    redoStack = [];
    toolPreview = null; 
});

// Handle mouse move event
drawingCanvas.addEventListener('mousemove', (e) => {
    if (drawing && currentStroke) {
        currentStroke.drag(e.offsetX, e.offsetY); 
        dispatchDrawingChangedEvent(); 
    } else {
        if (!toolPreview) {
            toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness); 
        } else {
            toolPreview.updatePosition(e.offsetX, e.offsetY); 
        }
        dispatchToolMovedEvent(); 
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
    toolPreview = null; 
});

// Dispatch custom "drawing-changed" event
const dispatchDrawingChangedEvent = () => {
    const event = new CustomEvent("drawing-changed");
    drawingCanvas.dispatchEvent(event); 
};

// Dispatch custom "tool-moved" event
const dispatchToolMovedEvent = () => {
    const event = new CustomEvent("tool-moved");
    drawingCanvas.dispatchEvent(event); 
};

// Event listener for "drawing-changed" event to clear and redraw
drawingCanvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

// Event listener for "tool-moved" event to show tool preview
drawingCanvas.addEventListener("tool-moved", () => {
    redrawCanvas(); 
    if (ctx && toolPreview) {
        toolPreview.draw(ctx);
    }
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

// Tool selection functionality
thinButton.addEventListener('click', () => {
    setTool(2); 
});

thickButton.addEventListener('click', () => {
    setTool(6); 
});
