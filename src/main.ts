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

// JSON array defining the initial stickers
let stickers = [
    { emoji: "😀", label: "Smiley" },
    { emoji: "🌟", label: "Star" },
    { emoji: "❤️", label: "Heart" }
];

// Append stickers to the UI from the array
const createStickerButton = (sticker: { emoji: string, label: string }) => {
    const stickerButton = document.createElement('button');
    stickerButton.textContent = sticker.emoji; 
    stickerButton.classList.add("sticker-button");
    stickerButton.addEventListener('click', () => {
        setTool(undefined, sticker.emoji); 
    });
    app.appendChild(stickerButton);
};

// Function to generate sticker buttons from the array
const renderStickers = () => {
    stickers.forEach(sticker => {
        createStickerButton(sticker);
    });
};

renderStickers();

// Create a button for adding a custom sticker
const addCustomStickerButton = document.createElement('button');
addCustomStickerButton.textContent = "Create Custom Sticker";
addCustomStickerButton.id = "customStickerButton";
app.appendChild(addCustomStickerButton);

// Event listener for creating custom stickers
addCustomStickerButton.addEventListener('click', () => {
    const newSticker = prompt("Enter your custom sticker (emoji or character)", "🙂"); 
    if (newSticker) {
        const stickerObj = { emoji: newSticker, label: `Custom Sticker: ${newSticker}` };
        stickers.push(stickerObj);
        createStickerButton(stickerObj); 
    }
});

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

    drag(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

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
let toolPreview: ToolPreview | null = null; 

// Function to set the selected tool (marker thickness or sticker)
const setTool = (thickness?: number, sticker?: string) => {
    currentThickness = thickness ?? currentThickness;
    currentStickerSymbol = sticker ?? null;

    document.querySelectorAll('button').forEach(button => {
        button.classList.remove('selectedTool');
    });

    if (thickness) {
        if (thickness === 2) thinButton.classList.add('selectedTool');
        else if (thickness === 6) thickButton.classList.add('selectedTool');
    }

    if (sticker) {
        const stickerButton = Array.from(document.querySelectorAll('button')).find(
            (btn) => btn.textContent === sticker
        );
        if (stickerButton) stickerButton.classList.add('selectedTool');
    }
};

setTool(2);

// Handle mouse down event
drawingCanvas.addEventListener('mousedown', (e) => {
    drawing = true;
    if (currentStickerSymbol) {
        currentSticker = new StickerCommand(e.offsetX, e.offsetY, currentStickerSymbol);
        redoStack = []; 
    } else {
        currentStroke = new MarkerLine(e.offsetX, e.offsetY, currentThickness); 
        redoStack = []; 
    }
    toolPreview = null;
});

// Handle mouse move event
drawingCanvas.addEventListener('mousemove', (e) => {
    if (drawing) {
        if (currentSticker) {
            currentSticker.drag(e.offsetX, e.offsetY); 
            dispatchDrawingChangedEvent();
        } else if (currentStroke) {
            currentStroke.drag(e.offsetX, e.offsetY);
            dispatchDrawingChangedEvent();
        }
    } else {
        if (!toolPreview) {
            if (currentStickerSymbol) {
                toolPreview = new ToolPreview(e.offsetX, e.offsetY, undefined, currentStickerSymbol);
            } else {
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
            strokes.push(currentSticker); 
            currentSticker = null;
        } else if (currentStroke) {
            strokes.push(currentStroke); 
            currentStroke = null;
        }
        drawing = false;
        dispatchDrawingChangedEvent();
    }
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

// Function to redraw the canvas based on the saved marker lines and stickers
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

// Undo function to pop the most recent stroke or sticker and add it to the redo stack
const undo = () => {
    if (strokes.length > 0) {
        const lastStroke = strokes.pop(); 
        if (lastStroke) redoStack.push(lastStroke); 
        dispatchDrawingChangedEvent(); 
    }
};

// Redo function to pop the most recent stroke or sticker from the redo stack and add it to strokes
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
