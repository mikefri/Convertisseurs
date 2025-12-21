const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const removeBgBtn = document.getElementById('remove-bg-btn');
const previewContainer = document.getElementById('preview-container');
const toleranceRange = document.getElementById('tolerance-range');
const toleranceValue = document.getElementById('tolerance-value');

let imgElement = null;

toleranceRange.addEventListener('input', () => {
    toleranceValue.innerText = toleranceRange.value;
});

upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        imgElement = new Image();
        imgElement.onload = () => {
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;
            ctx.drawImage(imgElement, 0, 0);
            previewContainer.style.display = 'block';
            document.getElementById('upload-label').style.display = 'none';
        };
        imgElement.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

removeBgBtn.addEventListener('click', () => {
    if (!imgElement) return;

    const width = canvas.width;
    const height = canvas.height;

    // Reset à l'original
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(imgElement, 0, 0);

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    const tolerance = parseInt(toleranceRange.value);
    
    // On prend la couleur de référence du fond (haut-gauche)
    const targetR = pixels[0];
    const targetG = pixels[1];
    const targetB = pixels[2];

    // ANALYSE GLOBALE (Scanne toute l'image sans exception)
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Calcul de la distance de couleur
        const dist = Math.sqrt(
            Math.pow(r - targetR, 2) +
            Math.pow(g - targetG, 2) +
            Math.pow(b - targetB, 2)
        );

        // Si c'est proche du fond, on rend transparent
        if (dist < tolerance) {
            pixels[i + 3] = 0; // Alpha à 0
        }
    }

    // On réinjecte les pixels modifiés
    ctx.putImageData(imgData, 0, 0);
    
    // OPTIONNEL : Un micro-lissage pour ne pas avoir de bords "pixel"
    ctx.globalCompositeOperation = 'destination-in';
    ctx.filter = 'blur(0.3px)';
    ctx.drawImage(canvas, 0, 0);

    removeBgBtn.innerText = "✨ Nettoyage complet effectué !";
});

document.getElementById('download-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = "detourage_pro.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});