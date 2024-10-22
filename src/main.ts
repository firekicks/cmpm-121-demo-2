import "./style.css";

const APP_NAME = "Hello, this is Atri!";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

app.innerHTML = ""; 

const appTitle = document.createElement('h1');
appTitle.textContent = APP_NAME;

const drawingCanvas = document.createElement('canvas');
drawingCanvas.width = 256;
drawingCanvas.height = 256;
drawingCanvas.id = "myCanvas"; 

app.appendChild(appTitle);
app.appendChild(drawingCanvas);
