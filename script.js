const upload = document.getElementById('upload');
const dropZone = document.getElementById('drop-zone');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const previewContainer = document.getElementById('preview-container');
const toleranceRange = document.getElementById('tolerance-range');
const toleranceValue = document.getElementById('tolerance-value');
const formatSelect = document.getElementById('format-select');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-image-btn');
const fileSizeDisplay = document.getElementById('file-size');

const inputW = document.getElementById('resize-w');
const inputH = document.getElementById('resize-h');
const checkRatio = document.getElementById('aspect-ratio');

let imgElement = null;
let ratio = 1;

// --- GESTION FICHIERS ---
function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        imgElement = new Image();
        imgElement.onload = () => {
            ratio = imgElement.width / imgElement.height;
            inputW.value = imgElement.width;
            inputH.value = imgElement.height;
            dropZone.style.display = 'none';
            previewContainer.style.display = 'grid';
            processImage();
        };
        imgElement.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

upload.addEventListener('change', (e) => handleFile(e.target.files[0]));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); });
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(n => {
    dropZone.addEventListener(n, (e) => { e.preventDefault(); e.stopPropagation(); });
});
['dragenter', 'dragover'].forEach(n => dropZone.addEventListener(n, () => dropZone.classList.add('highlight')));
['dragleave', 'drop'].forEach(n => dropZone.addEventListener(n, () => dropZone.classList.remove('highlight')));

// --- REDIMENSIONNEMENT TEMPS RÉEL ---
function updateFromWidth() {
    if(checkRatio.checked) inputH.value = Math.round(inputW.value / ratio);
    processImage();
}
function updateFromHeight() {
    if(checkRatio.checked) inputW.value = Math.round(inputH.value * ratio);
    processImage();
}

inputW.addEventListener('input', updateFromWidth);
inputH.addEventListener('input', updateFromHeight);
formatSelect.addEventListener('change', processImage);

// --- TRAITEMENT ET ESTIMATION POIDS ---
function processImage() {
    if (!imgElement) return;

    const w = parseInt(inputW.value) || imgElement.width;
    const h = parseInt(inputH.value) || imgElement.height;

    canvas.width = w;
    canvas.height = h;

    // Dessin avec redimensionnement
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imgElement, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const tolerance = parseInt(toleranceRange.value);
    const targetR = data[0], targetG = data[1], targetB = data[2];

    for (let i = 0; i < data.length; i += 4) {
        const dist = Math.sqrt(Math.pow(data[i]-targetR,2) + Math.pow(data[i+1]-targetG,2) + Math.pow(data[i+2]-targetB,2));
        if (dist < tolerance) data[i+3] = 0;
    }
    ctx.putImageData(imgData, 0, 0);

    // Estimation du poids
    estimateSize();
}

function estimateSize() {
    const dataUrl = canvas.toDataURL(formatSelect.value, 0.9);
    const sizeInBytes = Math.round((dataUrl.length - 22) * 3 / 4);
    if (sizeInBytes < 1024) fileSizeDisplay.innerText = sizeInBytes + " o";
    else fileSizeDisplay.innerText = (sizeInBytes / 1024).toFixed(1) + " Ko";
}

toleranceRange.addEventListener('input', () => {
    toleranceValue.innerText = toleranceRange.value;
    processImage();
});

resetBtn.addEventListener('click', () => {
    toleranceRange.value = 80;
    toleranceValue.innerText = "80";
    inputW.value = imgElement.width;
    inputH.value = imgElement.height;
    processImage();
});

// --- EXPORT ---
downloadBtn.addEventListener('click', () => {
    const format = formatSelect.value;
    const ext = format.split('/')[1];
    
    // Pour JPG/BMP on crée un canvas final avec fond blanc (pour éviter le fond noir du format)
    let finalCanvas = canvas;
    if (format === 'image/jpeg' || format === 'image/bmp') {
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = canvas.width;
        finalCanvas.height = canvas.height;
        const fCtx = finalCanvas.getContext('2d');
        fCtx.fillStyle = "#ffffff";
        fCtx.fillRect(0, 0, canvas.width, canvas.height);
        fCtx.drawImage(canvas, 0, 0);
    }

    const link = document.createElement('a');
    link.download = `image-pro-${canvas.width}x${canvas.height}.${ext}`;
    link.href = finalCanvas.toDataURL(format, 0.95);
    link.click();
});