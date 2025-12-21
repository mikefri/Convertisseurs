const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const removeBgBtn = document.getElementById('remove-bg-btn');
const previewContainer = document.getElementById('preview-container');

upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            previewContainer.style.display = 'block';
            document.getElementById('upload-label').style.display = 'none';
        };
        img.src = f.target.result;
    };
    reader.readAsDataURL(file);
});

removeBgBtn.addEventListener('click', () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // On part du pixel (0,0) en haut à gauche pour le fond
    const startX = 0;
    const startY = 0;
    const startIdx = (startY * width + startX) * 4;
    
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];

    // Tolérance : augmente cette valeur (ex: 80) si les traits rouges ne partent pas
    const tolerance = 50; 
    
    // Tableau pour marquer les pixels déjà visités
    const visited = new Uint8Array(width * height);
    const stack = [[startX, startY]];

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const idx = (y * width + x) * 4;

        if (x < 0 || x >= width || y < 0 || y >= height || visited[y * width + x]) continue;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Calcul de la ressemblance de couleur
        const distance = Math.sqrt(
            Math.pow(r - targetR, 2) +
            Math.pow(g - targetG, 2) +
            Math.pow(b - targetB, 2)
        );

        if (distance < tolerance) {
            visited[y * width + x] = 1;
            data[idx + 3] = 0; // On rend transparent

            // On propage aux pixels voisins (Haut, Bas, Gauche, Droite)
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }

    ctx.putImageData(imageData, 0, 0);
    removeBgBtn.innerText = "✅ Détourage baguette terminé !";
});

document.getElementById('download-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `icone-pro.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
});
