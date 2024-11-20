import "./style.css";

const APP_NAME = "Sticker Sketchpad";
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

const exportButton = document.createElement('button');
exportButton.textContent = "Export";
exportButton.id = "exportButton";

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
app.appendChild(exportButton);
app.appendChild(thinButton);
app.appendChild(thickButton);

// JSON array defining the initial stickers
const stickers = [
    { emoji: "✏️", label: "Pencil" },  // Pencil sticker
    { emoji: "🎨", label: "Palette" }, // Paint palette sticker
    { emoji: "✂️", label: "Scissors" } // Scissors sticker
];

// Append stickers to the UI from the array
const createStickerButton = (sticker: { emoji: string, label: string }) => {
    const stickerButton = document.createElement('button');
    stickerButton.textContent = sticker.emoji; 
    stickerButton.classList.add("sticker-button");
    stickerButton.addEventListener('click', () => {
        setTool(undefined, sticker.emoji); 
        randomizeStickerRotation(); // Randomize rotation for stickers
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

// Updated sticker randomization
let currentStickerRotation: number = 0; // Track rotation for the current sticker

// Function to set a random rotation for the sticker
const randomizeStickerRotation = () => {
    currentStickerRotation = Math.random() * 60 - 30; // Random rotation between -30 and +30 degrees
};

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
        ctx.lineWidth = this.thickness;
        ctx.lineCap = "round";
        ctx.strokeStyle = "black";
        if (this.points.length > 1) {
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

// StickerCommand class updated to apply random rotation when a sticker is placed
class StickerCommand {
    x: number;
    y: number;
    sticker: string;
    rotation: number; // New rotation property

    constructor(x: number, y: number, sticker: string, rotation: number) {
        this.x = x;
        this.y = y;
        this.sticker = sticker;
        this.rotation = rotation;
    }

    drag(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.save(); // Save the current state
        ctx.translate(this.x, this.y); // Move to the sticker position
        ctx.rotate(this.rotation * Math.PI / 180); // Apply rotation in radians
        ctx.font = "40px serif"; // Font size for stickers
        ctx.fillText(this.sticker, 0, 0); // Draw sticker at the translated position
        ctx.restore(); // Restore the original state
    }
}

// ToolPreview class updated to show rotated stickers
class ToolPreview {
    x: number;
    y: number;
    thickness?: number;
    sticker?: string;
    rotation?: number;

    constructor(x: number, y: number, thickness?: number, sticker?: string, rotation?: number) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
        this.sticker = sticker;
        this.rotation = rotation ?? 0;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.sticker) {
            ctx.save(); // Save the current state
            ctx.translate(this.x, this.y); // Move to the sticker position
            ctx.rotate((this.rotation ?? 0) * Math.PI / 180); // Rotate by the random rotation angle
            ctx.font = "40px serif"; // Updated font size for sticker preview
            ctx.fillText(this.sticker, 0, 0); // Draw at translated position
            ctx.restore(); // Restore the original state
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
let currentThickness = 3;
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
        currentSticker = new StickerCommand(e.offsetX, e.offsetY, currentStickerSymbol, currentStickerRotation);
        redoStack = []; 
    } else {
        currentStroke = new MarkerLine(e.offsetX, e.offsetY, currentThickness); 
        redoStack = []; 
    }
    toolPreview = null; 
    dispatchEvent("drawing-changed");
});

// Handle mouse move event
drawingCanvas.addEventListener('mousemove', (e) => {
    if (drawing) {
        if (currentSticker) {
            currentSticker.drag(e.offsetX, e.offsetY); 
            dispatchEvent("drawing-changed");
        } else if (currentStroke) {
            currentStroke.drag(e.offsetX, e.offsetY); 
            dispatchEvent("drawing-changed");
        }
        if (ctx) {
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);

            for (const stroke of strokes) {
                stroke.display(ctx);
            }
            if (currentStroke) currentStroke.display(ctx);
            if (currentSticker) currentSticker.display(ctx);
        }
    } else {
        if (!toolPreview) {
            if (currentStickerSymbol) {
                toolPreview = new ToolPreview(e.offsetX, e.offsetY, undefined, currentStickerSymbol, currentStickerRotation);
            } else {
                toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness, undefined);
            }
        } else {
            toolPreview.updatePosition(e.offsetX, e.offsetY);
        }
        dispatchEvent("tool-moved");
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
        dispatchEvent("drawing-changed");
    }
});

drawingCanvas.addEventListener("mouseleave", () => {
    if (currentSticker) {
        strokes.push(currentSticker); 
        currentSticker = null;
    } else if (currentStroke) {
        strokes.push(currentStroke); 
        currentStroke = null;
    }
    drawing = false;
    dispatchEvent("drawing-changed");
})

// Dispatch custom "drawing-changed" and "tool-moved" event by using a generalized function to call to them
function dispatchEvent(name: string) {
    drawingCanvas.dispatchEvent(new CustomEvent(name));
}

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
        dispatchEvent("drawing-changed"); 
    }
};

// Redo function to pop the most recent stroke or sticker from the redo stack and add it to strokes
const redo = () => {
    if (redoStack.length > 0) {
        const lastRedoStroke = redoStack.pop(); 
        if (lastRedoStroke) strokes.push(lastRedoStroke); 
        dispatchEvent("drawing-changed"); 
    }
};

// Clear canvas when button is clicked
clearButton.addEventListener('click', () => {
    strokes = []; 
    redoStack = []; 
    dispatchEvent("drawing-changed"); 
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
    setTool(3); 
});

thickButton.addEventListener('click', () => {
    setTool(10); 
});

// Export button functionality
exportButton.addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportCtx = exportCanvas.getContext('2d');
    
    if (exportCtx) {
        exportCtx.fillStyle = 'white';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        exportCtx.scale(4, 4); 
        for (const stroke of strokes) {
            stroke.display(exportCtx);
        }
        const imageUrl = exportCanvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = 'drawing.png';
        downloadLink.click();
    }
});
