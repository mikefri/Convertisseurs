const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const removeBgBtn = document.getElementById('remove-bg-btn');
const loadingMsg = document.getElementById('loading-msg');
const previewContainer = document.getElementById('preview-container');

let net = null; // Variable pour stocker l'IA une fois chargée

// 1. Gérer l'importation de l'image
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
        const img = new Image();
        img.onload = () => {
            // Ajuster le canvas à la taille de l'image
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

// 2. Fonction de suppression d'arrière-plan (Le cœur de l'IA)
removeBgBtn.addEventListener('click', async () => {
    removeBgBtn.disabled = true;
    loadingMsg.style.display = 'block';
    removeBgBtn.innerText = "⏳ Analyse...";

    try {
        // Charger le modèle si ce n'est pas déjà fait
        if (!net) {
            net = await bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 0.75,
                quantBytes: 2
            });
        }

        // Analyser l'image pour trouver la personne
        const segmentation = await net.segmentPerson(canvas, {
            internalResolution: 'high',
            segmentationThreshold: 0.5
        });

        // Récupérer les données de chaque pixel
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Boucle magique : on rend transparent tout ce qui n'est pas humain
        for (let i = 0; i < data.length; i += 4) {
            const isPerson = segmentation.data[i / 4];
            if (isPerson === 0) {
                data[i + 3] = 0; // On met l'opacité (Alpha) à zéro
            }
        }

        // Redessiner l'image modifiée sur le canvas
        ctx.putImageData(imageData, 0, 0);
        removeBgBtn.innerText = "✨ Arrière-plan supprimé !";
        
    } catch (err) {
        console.error("Erreur IA:", err);
        alert("L'IA n'a pas pu traiter l'image. Vérifiez qu'il y a bien une personne visible.");
    } finally {
        loadingMsg.style.display = 'none';
        removeBgBtn.disabled = false;
    }
});

// 3. Gérer le téléchargement
document.getElementById('download-btn').addEventListener('click', () => {
    const format = document.getElementById('format-select').value;
    const link = document.createElement('a');
    // Forcer l'extension selon le format choisi
    const ext = format === 'image/png' ? 'png' : 'jpg';
    link.download = `image-detouree.${ext}`;
    link.href = canvas.toDataURL(format);
    link.click();
});
