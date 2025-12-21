const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const removeBgBtn = document.getElementById('remove-bg-btn');
const previewContainer = document.getElementById('preview-container');
const toleranceRange = document.getElementById('tolerance-range');
const toleranceValue = document.getElementById('tolerance-value');

let imgElement = null;

// Mise à jour de l'affichage de la tolérance
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

    // IMPORTANT : On repart de l'image originale pour chaque clic
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(imgElement, 0, 0);

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    const tolerance = parseInt(toleranceRange.value);
    const visited = new Uint8Array(width * height);
    const mask = new Uint8Array(width * height).fill(255);
    const stack = [[0, 0]]; // Départ haut-gauche

    const targetR = pixels[0], targetG = pixels[1], targetB = pixels[2];

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const idx = y * width + x;
        if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) continue;

        const p = idx * 4;
        const dist = Math.sqrt(
            Math.pow(pixels[p] - targetR, 2) +
            Math.pow(pixels[p+1] - targetG, 2) +
            Math.pow(pixels[p+2] - targetB, 2)
        );

        if (dist < tolerance) {
            visited[idx] = 1;
            mask[idx] = 0; // Fond identifié
            stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
        }
    }

    // Création du masque de découpe lissé
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    const maskData = tempCtx.createImageData(width, height);

    for (let i = 0; i < mask.length; i++) {
        maskData.data[i * 4 + 3] = mask[i]; // Utilise le masque pour l'Alpha
    }
    tempCtx.putImageData(maskData, 0, 0);

    // Application finale avec micro-lissage
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.drawImage(imgElement, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.filter = 'blur(0.5px)'; // Lissage des bords
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    removeBgBtn.innerText = "✅ Ajusté !";
});

document.getElementById('download-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = "resultat.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});