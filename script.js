const upload = document.getElementById('upload');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const previewContainer = document.getElementById('preview-container');
const uploadSection = document.getElementById('drop-zone');
const toleranceRange = document.getElementById('tolerance-range');
const toleranceValue = document.getElementById('tolerance-value');
const formatSelect = document.getElementById('format-select');
const downloadBtn = document.getElementById('download-btn');

let imgElement = null;

// Fonction de détourage global
function processImage() {
    if (!imgElement) return;

    // On s'assure que le canvas fait exactement la taille de l'image source
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;

    // Dessin initial
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgElement, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    const tolerance = parseInt(toleranceRange.value);
    
    // Couleur cible (fond en haut à gauche)
    const targetR = pixels[0], targetG = pixels[1], targetB = pixels[2];

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i+1], b = pixels[i+2];

        const dist = Math.sqrt(
            Math.pow(r - targetR, 2) +
            Math.pow(g - targetG, 2) +
            Math.pow(b - targetB, 2)
        );

        if (dist < tolerance) {
            pixels[i + 3] = 0; // Rend transparent
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

// Écouteur curseur temps réel
toleranceRange.addEventListener('input', () => {
    toleranceValue.innerText = toleranceRange.value;
    processImage();
});

// Chargement fichier
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        imgElement = new Image();
        imgElement.onload = () => {
            uploadSection.style.display = 'none';
            previewContainer.style.display = 'grid';
            processImage();
        };
        imgElement.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Téléchargement et Conversion
downloadBtn.addEventListener('click', () => {
    if (!imgElement) return;

    const format = formatSelect.value;
    const extension = format.split('/')[1];
    const link = document.createElement('a');
    link.download = `image-convertie-${Date.now()}.${extension}`;

    if (format === 'image/jpeg') {
        // Pour le JPG, on remplit le fond transparent en blanc
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');
        tCtx.fillStyle = "#FFFFFF";
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tCtx.drawImage(canvas, 0, 0);
        link.href = tempCanvas.toDataURL('image/jpeg', 0.95);
    } else {
        link.href = canvas.toDataURL(format);
    }
    link.click();
});

// Gestion du Glisser-Déposer (Drag & Drop)
const dropZone = document.getElementById('drop-zone');

// Empêcher le comportement par défaut du navigateur (qui ouvre l'image)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

// Ajouter un effet visuel quand on survole la zone avec un fichier
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('highlight');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('highlight');
    }, false);
});

// Gérer la dépose du fichier
dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];

    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    } else {
        alert("Veuillez déposer un fichier image valide.");
    }
});

// Fonction utilitaire pour centraliser le traitement du fichier
function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        imgElement = new Image();
        imgElement.onload = () => {
            uploadSection.style.display = 'none';
            previewContainer.style.display = 'grid';
            processImage();
        };
        imgElement.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Modifie aussi ton écouteur "change" existant pour utiliser la nouvelle fonction handleFile
upload.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
});