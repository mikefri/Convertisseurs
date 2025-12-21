const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download-btn');
const previewContainer = document.getElementById('preview-container');

upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Ajuster le canvas à la taille de l'image
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            previewContainer.style.display = 'block';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

downloadBtn.addEventListener('click', () => {
    // Convertir le contenu du canvas en format WebP
    const webpData = canvas.toDataURL('image/webp', 0.8); // 0.8 = qualité 80%
    const link = document.createElement('a');
    link.href = webpData;
    link.download = 'image-optimisee.webp';
    link.click();
});
