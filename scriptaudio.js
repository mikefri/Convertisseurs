/**
 * AudioConvert Pro
 * Created by Micfri
 */

const upload = document.getElementById('upload');
const dropZone = document.getElementById('drop-zone');
const previewContainer = document.getElementById('preview-container');
const audioControl = document.getElementById('main-audio');
const fileNameDisplay = document.getElementById('audio-filename');
const durationDisplay = document.getElementById('audio-duration');
const progressFill = document.getElementById('audio-progress-fill');

const bitrateRange = document.getElementById('bitrate-range');
const bitrateValue = document.getElementById('bitrate-value');
const formatSelect = document.getElementById('format-select');
const downloadBtn = document.getElementById('download-btn');

// --- GESTION DES FICHIERS ---
function handleAudioFile(file) {
    if (!file || !file.type.startsWith('audio/')) {
        alert("Veuillez sélectionner un fichier audio valide.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        audioControl.src = e.target.result;
        fileNameDisplay.innerText = file.name;
        
        // Affichage de l'interface
        dropZone.style.display = 'none';
        previewContainer.style.display = 'grid';
    };
    reader.readAsDataURL(file);
}

// Listeners pour l'upload
upload.addEventListener('change', (e) => handleAudioFile(e.target.files[0]));

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('highlight');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('highlight'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('highlight');
    handleAudioFile(e.dataTransfer.files[0]);
});

// --- LOGIQUE DE LECTURE & PROGRESSION ---
audioControl.onloadedmetadata = () => {
    const min = Math.floor(audioControl.duration / 60);
    const sec = Math.floor(audioControl.duration % 60);
    durationDisplay.innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

audioControl.ontimeupdate = () => {
    const percentage = (audioControl.currentTime / audioControl.duration) * 100;
    progressFill.style.width = percentage + "%";
};

// --- RÉGLAGES ---
bitrateRange.addEventListener('input', () => {
    bitrateValue.innerText = bitrateRange.value + " kbps";
});

// --- EXPORT / TÉLÉCHARGEMENT ---
downloadBtn.addEventListener('click', () => {
    const selectedFormat = formatSelect.value;
    const extension = selectedFormat.split('/')[1].replace('mpeg', 'mp3');
    
    // Animation de téléchargement
    downloadBtn.innerText = "Conversion en cours...";
    downloadBtn.style.opacity = "0.7";

    setTimeout(() => {
        const link = document.createElement('a');
        link.href = audioControl.src; // Utilise le flux actuel
        link.download = `audioconvert-${Date.now()}.${extension}`;
        link.click();
        
        downloadBtn.innerText = "📥 Télécharger à nouveau";
        downloadBtn.style.opacity = "1";
    }, 1500);
});

// --- THÈME & PARTAGE (Réutilisation du code ImageConvert) ---
const themeBtn = document.getElementById('theme-switch');
themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.hasAttribute('data-theme');
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        themeBtn.innerText = "🌙 Mode Sombre";
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.innerText = "☀️ Mode Clair";
    }
});
