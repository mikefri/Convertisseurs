const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const previewContainer = document.getElementById('preview-container');
const uploadSection = document.getElementById('drop-zone');
const toleranceRange = document.getElementById('tolerance-range');
const toleranceValue = document.getElementById('tolerance-value');
const formatSelect = document.getElementById('format-select');
const resetBtn = document.getElementById('reset-image-btn');
const downloadBtn = document.getElementById('download-btn');

let imgElement = null;

function processImage() {
    if (!imgElement) return;
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgElement, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    const tolerance = parseInt(toleranceRange.value);
    const targetR = pixels[0], targetG = pixels[1], targetB = pixels[2];

    for (let i = 0; i < pixels.length; i += 4) {
        const dist = Math.sqrt(Math.pow(pixels[i]-targetR,2) + Math.pow(pixels[i+1]-targetG,2) + Math.pow(pixels[i+2]-targetB,2));
        if (dist < tolerance) pixels[i + 3] = 0;
    }
    ctx.putImageData(imgData, 0, 0);
}

toleranceRange.addEventListener('input', () => {
    toleranceValue.innerText = toleranceRange.value;
    processImage();
});

upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        imgElement = new Image();
        imgElement.onload = () => {
            uploadSection.style.display = 'none';
            previewContainer.style.display = 'grid';
            processImage();
        };
        imgElement.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

resetBtn.addEventListener('click', () => {
    toleranceRange.value = 80;
    toleranceValue.innerText = "80";
    processImage();
});

downloadBtn.addEventListener('click', () => {
    const format = formatSelect.value;
    const ext = format.split('/')[1];
    let link = document.createElement('a');
    link.download = `export_${Date.now()}.${ext}`;
    
    if (format === 'image/jpeg') {
        const temp = document.createElement('canvas');
        temp.width = canvas.width; temp.height = canvas.height;
        const tCtx = temp.getContext('2d');
        tCtx.fillStyle = "#fff"; tCtx.fillRect(0,0,temp.width,temp.height);
        tCtx.drawImage(canvas,0,0);
        link.href = temp.toDataURL(format, 0.9);
    } else {
        link.href = canvas.toDataURL(format);
    }
    link.click();
});