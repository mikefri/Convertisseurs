const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const removeBgBtn = document.getElementById('remove-bg-btn');
const previewContainer = document.getElementById('preview-container');
const uploadLabel = document.getElementById('upload-label');

let imgElement = null;

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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imgElement, 0, 0);
            
            previewContainer.style.display = 'block';
            uploadLabel.style.display = 'none';
        };
        imgElement.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Algorithme de détourage lissé
removeBgBtn.addEventListener('click', () => {
    if (!imgElement) return;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    // 1. Détection du fond (Flood Fill)
    const mask = new Uint8Array(width * height).fill(255); // 255 = objet
    const visited = new Uint8Array(width * height);
    const stack = [[0, 0]];
    
    // Couleur cible (haut-gauche)
    const targetR = pixels[0], targetG = pixels[1], targetB = pixels[2];
    const tolerance = 80; 

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
            mask[idx] = 0; // Fond
            stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
        }
    }

    // 2. Application propre
    ctx.clearRect(0, 0, width, height);
    
    // Créer un masque visuel
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    const maskData = tempCtx.createImageData(width, height);
    
    for(let i=0; i < mask.length; i++) {
        const alpha = mask[i];
        maskData.data[i*4] = 0;
        maskData.data[i*4+1] = 0;
        maskData.data[i*4+2] = 0;
        maskData.data[i*4+3] = alpha;
    }
    tempCtx.putImageData(maskData, 0, 0);

    // Dessiner l'image finale
    ctx.save();
    ctx.drawImage(imgElement, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.filter = 'blur(0.5px)'; // Lissage léger
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    removeBgBtn.innerText = "✅ Terminé";
});

// Téléchargement
document.getElementById('download-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = "image_convertie.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});
