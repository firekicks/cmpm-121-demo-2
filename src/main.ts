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

// Create sticker buttons
const sticker1Button = document.createElement('button');
sticker1Button.textContent = "😀"; // Sticker 1 (Smiley)

const sticker2Button = document.createElement('button');
sticker2Button.textContent = "🌟"; // Sticker 2 (Star)

const sticker3Button = document.createElement('button');
sticker3Button.textContent = "❤️"; // Sticker 3 (Heart)

// Append elements to app
app.appendChild(appTitle);
app.appendChild(drawingCanvas);
app.appendChild(clearButton);
app.appendChild(undoButton);
app.appendChild(redoButton);
app.appendChild(thinButton);
app.appendChild(thickButton);
app.appendChild(sticker1Button);
app.appendChild(sticker2Button);
app.appendChild(sticker3Button);

// Get canvas context
const ctx = drawingCanvas.getContext('2d');
if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

// MarkerLine class to represent each line drawn on the canvas
class MarkerLine {
    points: { x: number, y: number }[];
    thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.points = [{ x, y }];
        this.thickness = thickness;
    }

    // Adds a new point to the line as the user drags
    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    // Displays the line on the canvas
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

// StickerCommand class to represent each sticker placed on the canvas
class StickerCommand {
    x: number;
    y: number;
    sticker: string;

    constructor(x: number, y: number, sticker: string) {
        this.x = x;
        this.y = y;
        this.sticker = sticker;
    }

    // Reposition the sticker
    drag(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // Display the sticker on the canvas
    display(ctx: CanvasRenderingContext2D) {
        ctx.font = "32px serif";
        ctx.fillText(this.sticker, this.x, this.y);
    }
}

// ToolPreview class to display the preview of the tool or sticker
class ToolPreview {
    x: number;
    y: number;
    thickness?: number;
    sticker?: string;

    constructor(x: number, y: number, thickness?: number, sticker?: string) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
        this.sticker = sticker;
    }

    // Updates the position of the preview
    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // Draws the preview circle or sticker on the canvas
    draw(ctx: CanvasRenderingContext2D) {
        if (this.sticker) {
            ctx.font = "32px serif";
            ctx.fillText(this.sticker, this.x, this.y);
        } else if (this.thickness) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "gray";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.thickness / 2, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
}

// Arrays to store marker lines, stickers, and redo stack
let strokes: (MarkerLine | StickerCommand)[] = [];
let redoStack: (MarkerLine | StickerCommand)[] = [];
let currentStroke: MarkerLine | null = null;
let currentSticker: StickerCommand | null = null;
let drawing = false;

// Variable to track the current tool (default to thin marker)
let currentThickness = 2;
let currentStickerSymbol: string | null = null;
let toolPreview: ToolPreview | null = null; // Global reference to the tool preview object

// Function to set the selected tool (marker thickness or sticker)
const setTool = (thickness?: number, sticker?: string) => {
    currentThickness = thickness ?? currentThickness;
    currentStickerSymbol = sticker ?? null;

    document.querySelectorAll('button').forEach(button => {
        button.classList.remove('selectedTool'); // Remove selection from all buttons
    });

    if (thickness) {
        if (thickness === 2) thinButton.classList.add('selectedTool');
        else if (thickness === 6) thickButton.classList.add('selectedTool');
    }

    if (sticker) {
        if (sticker === "😀") sticker1Button.classList.add('selectedTool');
        else if (sticker === "🌟") sticker2Button.classList.add('selectedTool');
        else if (sticker === "❤️") sticker3Button.classList.add('selectedTool');
    }
};

// Set default tool to thin
setTool(2);

// Handle mouse down event
drawingCanvas.addEventListener('mousedown', (e) => {
    drawing = true;
    if (currentStickerSymbol) {
        currentSticker = new StickerCommand(e.offsetX, e.offsetY, currentStickerSymbol);
        redoStack = []; // Clear redo stack when new drawing starts
    } else {
        currentStroke = new MarkerLine(e.offsetX, e.offsetY, currentThickness); // Create a new MarkerLine with the current thickness
        redoStack = []; // Clear redo stack when new drawing starts
    }
    toolPreview = null; // Remove tool preview when drawing starts
});

// Handle mouse move event
// Handle mouse move event
drawingCanvas.addEventListener('mousemove', (e) => {
    if (drawing) {
        if (currentSticker) {
            currentSticker.drag(e.offsetX, e.offsetY); // Reposition the sticker
            dispatchDrawingChangedEvent();
        } else if (currentStroke) {
            currentStroke.drag(e.offsetX, e.offsetY); // Add points as the mouse moves
            dispatchDrawingChangedEvent();
        }
    } else {
        // Update the tool preview based on whether a marker or sticker is selected
        if (!toolPreview) {
            if (currentStickerSymbol) {
                // If a sticker is selected, create a sticker preview
                toolPreview = new ToolPreview(e.offsetX, e.offsetY, undefined, currentStickerSymbol);
            } else {
                // If a marker is selected, create a marker preview
                toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness, undefined);
            }
        } else {
            toolPreview.updatePosition(e.offsetX, e.offsetY);
        }
        dispatchToolMovedEvent();
    }
});


// Handle mouse up event
drawingCanvas.addEventListener('mouseup', () => {
    if (drawing) {
        if (currentSticker) {
            strokes.push(currentSticker); // Save the current sticker
            currentSticker = null;
        } else if (currentStroke) {
            strokes.push(currentStroke); // Save the current stroke
            currentStroke = null;
        }
        drawing = false;
        dispatchDrawingChangedEvent();
    }
});

// Dispatch custom "drawing-changed" event
const dispatchDrawingChangedEvent = () => {
    const event = new CustomEvent("drawing-changed");
    drawingCanvas.dispatchEvent(event); // Dispatch the custom event
};

// Dispatch custom "tool-moved" event
const dispatchToolMovedEvent = () => {
    const event = new CustomEvent("tool-moved");
    drawingCanvas.dispatchEvent(event); // Dispatch the custom event
};

// Event listener for "drawing-changed" event to clear and redraw
drawingCanvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

// Event listener for "tool-moved" event to show tool preview
drawingCanvas.addEventListener("tool-moved", () => {
    redrawCanvas(); // Redraw the canvas to show the preview
    if (ctx && toolPreview) {
        toolPreview.draw(ctx); // Draw the tool or sticker preview
    }
});

// Function to redraw the canvas based on the saved marker lines and stickers
const redrawCanvas = () => {
    if (ctx) {
        // Clear the canvas
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        // Redraw all the strokes and stickers using the display method of each command
        for (const stroke of strokes) {
            stroke.display(ctx);
        }
    }
};

// Undo function to pop the most recent stroke or sticker and add it to the redo stack
const undo = () => {
    if (strokes.length > 0) {
        const lastStroke = strokes.pop(); // Remove the last stroke or sticker
        if (lastStroke) redoStack.push(lastStroke); // Add to redo stack
        dispatchDrawingChangedEvent(); // Trigger the event to redraw the canvas
    }
};

// Redo function to pop the most recent stroke or sticker from the redo stack and add it to strokes
const redo = () => {
    if (redoStack.length > 0) {
        const lastRedoStroke = redoStack.pop(); // Remove the last stroke from redo stack
        if (lastRedoStroke) strokes.push(lastRedoStroke); // Add back to strokes
        dispatchDrawingChangedEvent(); // Trigger the event to redraw the canvas
    }
};

// Clear canvas when button is clicked
clearButton.addEventListener('click', () => {
    strokes = []; // Reset the strokes
    redoStack = []; // Clear redo stack
    dispatchDrawingChangedEvent(); // Trigger the event to clear the canvas
});

// Undo button functionality
undoButton.addEventListener('click', () => {
    undo(); // Call undo function
});

// Redo button functionality
redoButton.addEventListener('click', () => {
    redo(); // Call redo function
});

// Tool selection functionality
thinButton.addEventListener('click', () => {
    setTool(2); // Set thin marker tool
});

thickButton.addEventListener('click', () => {
    setTool(6); // Set thick marker tool
});

// Sticker selection functionality
sticker1Button.addEventListener('click', () => {
    setTool(undefined, "😀"); // Set smiley sticker tool
});

sticker2Button.addEventListener('click', () => {
    setTool(undefined, "🌟"); // Set star sticker tool
});

sticker3Button.addEventListener('click', () => {
    setTool(undefined, "❤️"); // Set heart sticker tool
});
