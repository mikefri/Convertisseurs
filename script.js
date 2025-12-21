const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const removeBgBtn = document.getElementById('remove-bg-btn');
const loadingMsg = document.getElementById('loading-msg');
const previewContainer = document.getElementById('preview-container');

let selfieSegmentation;

// Initialisation de MediaPipe
async function initMediaPipe() {
    selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    selfieSegmentation.setOptions({
        modelSelection: 1, // 1 pour plus de précision
    });

    selfieSegmentation.onResults(onResults);
}

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

function onResults(results) {
    // On prépare le canvas pour le détourage
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // On dessine le masque (ce que l'IA garde)
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

    // On utilise le masque pour ne garder que l'objet
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    
    ctx.restore();
    
    loadingMsg.style.display = 'none';
    removeBgBtn.innerText = "✨ Arrière-plan supprimé !";
    removeBgBtn.disabled = false;
}

removeBgBtn.addEventListener('click', async () => {
    removeBgBtn.disabled = true;
    loadingMsg.style.display = 'block';
    
    if (!selfieSegmentation) {
        await initMediaPipe();
    }

    // On envoie l'image du canvas à l'IA
    await selfieSegmentation.send({ image: canvas });
});

// Téléchargement
document.getElementById('download-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `image-detouree.png`;
    link.href = canvas.toDataURL();
    link.click();
});
