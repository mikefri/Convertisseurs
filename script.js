const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const removeBgBtn = document.getElementById('remove-bg-btn');
const loadingMsg = document.getElementById('loading-msg');
const imageDisplay = document.getElementById('image-display');
const previewContainer = document.getElementById('preview-container');

let net = null;

// Charger le modèle au clic pour ne pas ralentir le site au début
async function loadModel() {
    if (!net) {
        net = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2
        });
    }
    return net;
}

upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            imageDisplay.src = event.target.result;
            previewContainer.style.display = 'block';
            document.getElementById('upload-label').style.display = 'none';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

removeBgBtn.addEventListener('click', async () => {
    removeBgBtn.disabled = true;
    loadingMsg.style.display = 'block';
    
    try {
        const model = await loadModel();
        // Segmentation de la personne
        const segmentation = await model.segmentPerson(imageDisplay);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixel = imageData.data;

        for (let i = 0; i < pixel.length; i += 4) {
            // Si le pixel n'appartient pas à une personne (segmentation == 0)
            if (segmentation.data[i / 4] === 0) {
                pixel[i + 3] = 0; // On rend le pixel transparent
            }
        }

        ctx.putImageData(imageData, 0, 0);
        imageDisplay.src = canvas.toDataURL();
        alert("Arrière-plan supprimé !");
    } catch (error) {
        console.error(error);
        alert("Erreur lors du détourage.");
    } finally {
        loadingMsg.style.display = 'none';
        removeBgBtn.disabled = false;
    }
});

// Téléchargement
document.getElementById('download-btn').addEventListener('click', () => {
    const format = document.getElementById('format-select').value;
    const link = document.createElement('a');
    link.download = `resultat.${format.split('/')[1]}`;
    link.href = canvas.toDataURL(format);
    link.click();
});

document.getElementById('reset-btn').addEventListener('click', () => location.reload());
