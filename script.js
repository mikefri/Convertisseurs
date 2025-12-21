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

    // On récupère la couleur du premier pixel (souvent le fond)
    const targetR = data[0];
    const targetG = data[1];
    const targetB = data[2];
    
    // Tolérance (plus c'est haut, plus on supprime de nuances de blanc/gris)
    const threshold = 40; 

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calcul de la différence de couleur
        const distance = Math.sqrt(
            Math.pow(r - targetR, 2) +
            Math.pow(g - targetG, 2) +
            Math.pow(b - targetB, 2)
        );

        if (distance < threshold) {
            data[i + 3] = 0; // Transparence
        }
    }

    ctx.putImageData(imageData, 0, 0);
    removeBgBtn.innerText = "✅ Fond supprimé !";
});

document.getElementById('download-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `icone-transparente.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
});
