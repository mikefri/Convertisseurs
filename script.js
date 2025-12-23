/**
 * ImageConvert Pro
 * Created by Micfri
 * Description: Studio local de traitement d'image (Détourage, Resize, Format)
 */
const upload = document.getElementById('upload');
const dropZone = document.getElementById('drop-zone');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const previewContainer = document.getElementById('preview-container');
const toleranceRange = document.getElementById('tolerance-range');
const toleranceValue = document.getElementById('tolerance-value');
const formatSelect = document.getElementById('format-select');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-image-btn');
const fileSizeDisplay = document.getElementById('file-size');
const colorPreview = document.getElementById('color-preview'); // La pastille ajoutée au HTML

const inputW = document.getElementById('resize-w');
const inputH = document.getElementById('resize-h');
const checkRatio = document.getElementById('aspect-ratio');

let imgElement = null;
let ratio = 1;
let targetColor = null; // Stocke la couleur [R, G, B] sélectionnée par l'utilisateur

// --- GESTION FICHIERS ---
function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        imgElement = new Image();
        imgElement.onload = () => {
            ratio = imgElement.width / imgElement.height;
            inputW.value = imgElement.width;
            inputH.value = imgElement.height;
            targetColor = null; // Reset de la pipette lors d'un nouvel import
            dropZone.style.display = 'none';
            previewContainer.style.display = 'grid';
            processImage();
        };
        imgElement.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

upload.addEventListener('change', (e) => handleFile(e.target.files[0]));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); });
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(n => {
    dropZone.addEventListener(n, (e) => { e.preventDefault(); e.stopPropagation(); });
});
['dragenter', 'dragover'].forEach(n => dropZone.addEventListener(n, () => dropZone.classList.add('highlight')));
['dragleave', 'drop'].forEach(n => dropZone.addEventListener(n, () => dropZone.classList.remove('highlight')));

// --- GESTION DE LA PIPETTE (CLIC SUR IMAGE) ---
canvas.addEventListener('click', (e) => {
    if (!imgElement) return;

    // Calcul de la position réelle sur le canvas (gestion du responsive)
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // On récupère la couleur du pixel cliqué sur le canvas original (non traité)
    // Pour être précis, on redessine temporairement l'original si nécessaire ou on lit avant le détourage
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    targetColor = [pixel[0], pixel[1], pixel[2]];
    
    processImage();
});

// --- REDIMENSIONNEMENT TEMPS RÉEL ---
function updateFromWidth() {
    if(checkRatio.checked && imgElement) inputH.value = Math.round(inputW.value / ratio);
    processImage();
}
function updateFromHeight() {
    if(checkRatio.checked && imgElement) inputW.value = Math.round(inputH.value * ratio);
    processImage();
}

inputW.addEventListener('input', updateFromWidth);
inputH.addEventListener('input', updateFromHeight);
formatSelect.addEventListener('change', processImage);

// --- TRAITEMENT ET ESTIMATION POIDS ---
function processImage() {
    if (!imgElement) return;

    const w = parseInt(inputW.value) || imgElement.width;
    const h = parseInt(inputH.value) || imgElement.height;

    canvas.width = w;
    canvas.height = h;

    // 1. Dessiner l'image originale redimensionnée
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imgElement, 0, 0, w, h);

    // 2. Récupérer les données pour le détourage
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const tolerance = parseInt(toleranceRange.value);

    // Définition de la couleur cible (Pipette ou pixel 0,0)
    let rT, gT, bT;
    if (targetColor) {
        [rT, gT, bT] = targetColor;
    } else {
        rT = data[0]; gT = data[1]; bT = data[2];
    }

    // Mise à jour visuelle de la pastille dans la sidebar
    if (colorPreview) {
        colorPreview.style.backgroundColor = `rgb(${rT}, ${gT}, ${bT})`;
    }

    // 3. Algorithme de suppression de couleur
    for (let i = 0; i < data.length; i += 4) {
        const dist = Math.sqrt(
            Math.pow(data[i] - rT, 2) +
            Math.pow(data[i + 1] - gT, 2) +
            Math.pow(data[i + 2] - bT, 2)
        );
        if (dist < tolerance) {
            data[i + 3] = 0; // Transparence
        }
    }
    ctx.putImageData(imgData, 0, 0);

    // 4. Estimation du poids
    estimateSize();
}

function estimateSize() {
    const dataUrl = canvas.toDataURL(formatSelect.value, 0.9);
    const sizeInBytes = Math.round((dataUrl.length - 22) * 3 / 4);
    if (sizeInBytes < 1024) fileSizeDisplay.innerText = sizeInBytes + " o";
    else fileSizeDisplay.innerText = (sizeInBytes / 1024).toFixed(1) + " Ko";
}

toleranceRange.addEventListener('input', () => {
    toleranceValue.innerText = toleranceRange.value;
    processImage();
});

resetBtn.addEventListener('click', () => {
    targetColor = null; // Reset de la pipette
    toleranceRange.value = 80;
    toleranceValue.innerText = "80";
    if (imgElement) {
        inputW.value = imgElement.width;
        inputH.value = imgElement.height;
    }
    processImage();
});

// --- EXPORT ---
downloadBtn.addEventListener('click', () => {
    const format = formatSelect.value;
    let ext = format.split('/')[1];
    if (ext === 'x-icon') ext = 'ico'; // Correction pour l'extension ICO
    
    let finalCanvas = canvas;

    // Gestion du fond pour JPEG/BMP
    if (format === 'image/jpeg' || format === 'image/bmp') {
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = canvas.width;
        finalCanvas.height = canvas.height;
        const fCtx = finalCanvas.getContext('2d');
        fCtx.fillStyle = "#ffffff";
        fCtx.fillRect(0, 0, canvas.width, canvas.height);
        fCtx.drawImage(canvas, 0, 0);
    }

    // Gestion spécifique pour l'ICO HD
    let exportUrl;
    if (format === 'image/x-icon') {
        // Pour l'ICO, on s'assure d'utiliser le format PNG en interne pour garder la transparence HD
        exportUrl = canvas.toDataURL('image/png'); 
    } else {
        exportUrl = finalCanvas.toDataURL(format, 0.95);
    }

    const link = document.createElement('a');
    link.download = `image-pro-${canvas.width}x${canvas.height}.${ext}`;
    link.href = exportUrl;
    link.click();
});

// --- LOGIQUE DE LA MODALE D'AIDE ---
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeModal = document.querySelector('.close-modal');

if (helpBtn) {
    helpBtn.onclick = () => helpModal.style.display = "flex";
}
if (closeModal) {
    closeModal.onclick = () => helpModal.style.display = "none";
}

window.onclick = (event) => {
    if (event.target == helpModal) helpModal.style.display = "none";
}
// --- LOGIQUE DE PARTAGE ---
const currentUrl = encodeURIComponent(window.location.href);
const shareText = encodeURIComponent("Regarde cet outil gratuit pour détourer et redimensionner des images en ligne ! ✨");

document.getElementById('share-wa').href = `https://api.whatsapp.com/send?text=${shareText}%20${currentUrl}`;
document.getElementById('share-tw').href = `https://twitter.com/intent/tweet?text=${shareText}&url=${currentUrl}`;

document.getElementById('share-link').onclick = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Lien copié dans le presse-papier ! 📋");
};


// --- LOGIQUE THÈME SOMBRE (Version corrigée) ---
const themeBtn = document.getElementById('theme-switch');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if(themeIcon) themeIcon.innerText = "☀️";
        if(themeText) themeText.innerText = "Mode Clair";
    } else {
        document.documentElement.removeAttribute('data-theme');
        if(themeIcon) themeIcon.innerText = "🌙";
        if(themeText) themeText.innerText = "Mode Sombre";
    }
}

// Vérification au chargement
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') applyTheme('dark');

// L'écouteur d'événement
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.hasAttribute('data-theme');
        const newTheme = isDark ? 'light' : 'dark';
        
        // Petite animation de rotation sur l'icône
        if(themeIcon) {
            themeIcon.style.transition = "transform 0.5s ease";
            themeIcon.style.transform = "rotate(360deg)";
            setTimeout(() => themeIcon.style.transform = "rotate(0deg)", 500);
        }
        
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

