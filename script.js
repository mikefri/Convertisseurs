const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const previewContainer = document.getElementById('preview-container');
const toleranceRange = document.getElementById('tolerance-range');
const toleranceValue = document.getElementById('tolerance-value');
const formatSelect = document.getElementById('format-select');
const resetBtn = document.getElementById('reset-image-btn');
const downloadBtn = document.getElementById('download-btn');

let imgElement = null;

// Mise à jour de l'affichage du chiffre de tolérance
toleranceRange.addEventListener('input', () => {
    toleranceValue.innerText = toleranceRange.value;
    processImage(); // Rendu immédiat
});

// Fonction principale de traitement
function processImage() {
    if (!imgElement) return;

    const width = canvas.width;
    const height = canvas.height;

    // On redessine l'original pour appliquer le nouveau réglage
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(imgElement, 0, 0);

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    const tolerance = parseInt(toleranceRange.value);
    
    // Couleur de référence (haut-gauche)
    const targetR = pixels[0], targetG = pixels[1], targetB = pixels[2];

    for (let i = 0; i < pixels.length; i += 4) {
        const dist = Math.sqrt(
            Math.pow(pixels[i] - targetR, 2) +
            Math.pow(pixels[i+1] - targetG, 2) +
            Math.pow(pixels[i+2] - targetB, 2)
        );

        if (dist < tolerance) {
            pixels[i + 3] = 0; // Transparence
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

// Chargement de l'image
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        imgElement = new Image();
        imgElement.onload = () => {
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;
            processImage();
            previewContainer.style.display = 'block';
            document.getElementById('upload-label').style.display = 'none';
        };
        imgElement.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Réinitialisation du curseur
resetBtn.addEventListener('click', () => {
    toleranceRange.value = 0;
    toleranceValue.innerText = "0";
    processImage();
});

// Téléchargement avec conversion de format
downloadBtn.addEventListener('click', () => {
    const format = formatSelect.value; // ex: image/jpeg ou image/png
    const extension = format.split('/')[1]; // ex: png
    
    // Si l'utilisateur choisit JPG, on doit remplir le fond transparent en blanc
    if (format === 'image/jpeg') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.fillStyle = "#FFFFFF"; // Fond blanc
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
        
        const link = document.createElement('a');
        link.download = `image_convertie.${extension}`;
        link.href = tempCanvas.toDataURL(format, 0.9); // Qualité 90% pour JPG
        link.click();
    } else {
        // Pour PNG et WebP qui gèrent la transparence
        const link = document.createElement('a');
        link.download = `image_convertie.${extension}`;
        link.href = canvas.toDataURL(format);
        link.click();
    }
});