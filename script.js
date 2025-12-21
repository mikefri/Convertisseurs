const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const removeBgBtn = document.getElementById('remove-bg-btn');
const previewContainer = document.getElementById('preview-container');

let originalImage = null;

upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
        originalImage = new Image();
        originalImage.onload = () => {
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            ctx.drawImage(originalImage, 0, 0);
            previewContainer.style.display = 'block';
            document.getElementById('upload-label').style.display = 'none';
        };
        originalImage.src = f.target.result;
    };
    reader.readAsDataURL(file);
});

removeBgBtn.addEventListener('click', () => {
    const width = canvas.width;
    const height = canvas.height;
    
    // 1. On récupère les pixels pour l'analyse
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    
    // 2. Création d'un masque de transparence (0 = fond, 255 = objet)
    const mask = new Uint8ClampedArray(width * height);
    
    const targetR = pixels[0], targetG = pixels[1], targetB = pixels[2];
    const tolerance = 70; // Augmenter si les traits rouges restent

    // Algorithme de propagation pour ne pas toucher à l'intérieur
    const visited = new Uint8Array(width * height);
    const stack = [[0, 0]];
    mask.fill(255); // Par défaut, tout est objet

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
            mask[idx] = 0; // C'est du fond
            stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
        }
    }

    // 3. Application du masque avec lissage des bords
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    
    // On dessine le masque sur un canvas temporaire pour le flouter légèrement (lissage)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    const maskImg = tempCtx.createImageData(width, height);
    
    for(let i=0; i<mask.length; i++) {
        const val = mask[i];
        maskImg.data[i*4] = val;
        maskImg.data[i*4+1] = val;
        maskImg.data[i*4+2] = val;
        maskImg.data[i*4+3] = 255;
    }
    tempCtx.putImageData(maskImg, 0, 0);
    
    // Dessiner l'image originale
    ctx.drawImage(originalImage, 0, 0);
    
    // Appliquer le masque lissé en mode découpe
    ctx.globalCompositeOperation = 'destination-in';
    ctx.filter = 'blur(1px)'; // Ce petit flou lisse les bords "escalier"
    ctx.drawImage(tempCanvas, 0, 0);
    
    ctx.restore();
    removeBgBtn.innerText = "✅ Bords lissés terminés !";
});
