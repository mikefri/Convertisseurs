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

// Drag & Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(n => {
    dropZone.addEventListener(n, (e) => { e.preventDefault(); e.stopPropagation(); });
});
['dragenter', 'dragover'].forEach(n => dropZone.addEventListener(n, () => dropZone.classList.add('highlight')));
['dragleave', 'drop'].forEach(n => dropZone.addEventListener(n, () => dropZone.classList.remove('highlight')));
dropZone.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

// --- REDIMENSIONNEMENT ---
inputW.addEventListener('input', () => {
    if(checkRatio.checked) inputH.value = Math.round(inputW.value / ratio);
});
inputH.addEventListener('input', () => {
    if(checkRatio.checked) inputW.value = Math.round(inputH.value * ratio);
});

// --- TRAITEMENT IMAGE ---
function processImage() {
    if (!imgElement) return;
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const tolerance = parseInt(toleranceRange.value);
    
    // On prend la couleur du premier pixel (fond)
    const targetR = data[0], targetG = data[1], targetB = data[2];

    for (let i = 0; i < data.length; i += 4) {
        const dist = Math.sqrt(
            Math.pow(data[i] - targetR, 2) +
            Math.pow(data[i+1] - targetG, 2) +
            Math.pow(data[i+2] - targetB, 2)
        );
        if (dist < tolerance) data[i+3] = 0;
    }
    ctx.putImageData(imgData, 0, 0);
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

// --- TÉLÉCHARGEMENT ---
downloadBtn.addEventListener('click', () => {
    const finalW = parseInt(inputW.value);
    const finalH = parseInt(inputH.value);
    
    const outCanvas = document.createElement('canvas');
    outCanvas.width = finalW;
    outCanvas.height = finalH;
    const oCtx = outCanvas.getContext('2d');

    const format = formatSelect.value;
    
    // Fond blanc pour JPG et BMP
    if (format === 'image/jpeg' || format === 'image/bmp') {
        oCtx.fillStyle = "#ffffff";
        oCtx.fillRect(0, 0, finalW, finalH);
    }

    oCtx.drawImage(canvas, 0, 0, finalW, finalH);

    const link = document.createElement('a');
    link.download = `image-convertie-${finalW}x${finalH}.${format.split('/')[1]}`;
    link.href = outCanvas.toDataURL(format, 0.92);
    link.click();
});