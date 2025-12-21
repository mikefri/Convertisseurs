const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const previewContainer = document.getElementById('preview-container');
const toleranceRange = document.getElementById('tolerance-range');
const toleranceValue = document.getElementById('tolerance-value');
const resetBtn = document.getElementById('reset-image-btn');

let imgElement = null;

// FONCTION DE DÉTOURAGE (Appelée en temps réel)
function processImage() {
    if (!imgElement) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. On redessine toujours l'original d'abord
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(imgElement, 0, 0);

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    const tolerance = parseInt(toleranceRange.value);
    
    // Couleur du fond (haut-gauche)
    const targetR = pixels[0], targetG = pixels[1], targetB = pixels[2];

    // 2. Analyse pixel par pixel
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

// ÉVÈNEMENT : Modification du curseur
toleranceRange.addEventListener('input', () => {
    toleranceValue.innerText = toleranceRange.value;
    processImage(); // On traite l'image dès que le curseur bouge
});

// ÉVÈNEMENT : Chargement de l'image
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        imgElement = new Image();
        imgElement.onload = () => {
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;
            processImage(); // Premier rendu
            previewContainer.style.display = 'block';
            document.getElementById('upload-label').style.display = 'none';
        };
        imgElement.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// BOUTON REVENIR EN ARRIÈRE (Réinitialiser)
resetBtn.addEventListener('click', () => {
    toleranceRange.value = 0;
    toleranceValue.innerText = "0";
    processImage();
});

// TÉLÉCHARGEMENT
document.getElementById('download-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = "image_pro.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});