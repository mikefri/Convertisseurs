/**
 * AudioConvert Pro - scriptaudio.js
 * Version finale compatible avec coi-serviceworker.js
 */

const { createFFmpeg, fetchFile } = FFmpeg;

// Initialisation moderne de FFmpeg
const ffmpeg = createFFmpeg({ 
    log: true 
});

// --- ÉLÉMENTS DE L'INTERFACE ---
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
const fileSizeDisplay = document.getElementById('file-size');

// --- 1. LECTURE AUDIO & APPERÇU ---
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.innerText = file.name;
        audioControl.src = URL.createObjectURL(file);
        
        // Affiche l'éditeur et cache la zone d'upload
        if(dropZone) dropZone.style.display = 'none';
        if(previewContainer) previewContainer.style.display = 'grid';
    }
});

// Met à jour la barre de progression violette pendant l'écoute
audioControl.ontimeupdate = () => {
    if (audioControl.duration) {
        const percentage = (audioControl.currentTime / audioControl.duration) * 100;
        progressFill.style.width = percentage + "%";
    }
};

// Affiche la durée quand le fichier est prêt
audioControl.onloadedmetadata = () => {
    const min = Math.floor(audioControl.duration / 60);
    const sec = Math.floor(audioControl.duration % 60);
    durationDisplay.innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    updateEstimation();
};

// --- 2. ESTIMATION DU POIDS DU FICHIER ---
function updateEstimation() {
    const format = formatSelect.value;
    const isLossy = ['mp3', 'ogg', 'm4a', 'aac'].includes(format);
    
    if (audioControl.duration && isLossy) {
        const kbps = parseInt(bitrateRange.value);
        const sizeMb = (kbps * audioControl.duration) / 8000;
        fileSizeDisplay.innerText = `~${sizeMb.toFixed(1)} Mo`;
    } else {
        fileSizeDisplay.innerText = "--";
    }
}

bitrateRange.addEventListener('input', () => {
    bitrateValue.innerText = bitrateRange.value + " kbps";
    updateEstimation();
});

formatSelect.addEventListener('change', updateEstimation);

// --- 3. CONVERSION RÉELLE (ACTION DU BOUTON) ---
downloadBtn.addEventListener('click', async () => {
    const file = upload.files[0];
    if (!file) return;

    const outFormat = formatSelect.value;
    const bitrate = bitrateRange.value;

    downloadBtn.disabled = true;
    downloadBtn.innerText = "⏳ Chargement du moteur...";

    try {
        // Chargement du moteur FFmpeg (Maintenant débloqué par le point vert !)
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        const inputExt = file.name.split('.').pop();
        const inputName = `input.${inputExt}`;
        const outputName = `output.${outFormat}`;

        // Transfère le fichier vers la mémoire de FFmpeg
        ffmpeg.FS('writeFile', inputName, await fetchFile(file));
        
        downloadBtn.innerText = "⚙️ Encodage réel en cours...";
        
        // Commande FFmpeg : réduit réellement le poids du fichier
        let args = ['-i', inputName];
        if (['mp3', 'ogg', 'm4a', 'aac'].includes(outFormat)) {
            args.push('-b:a', `${bitrate}k`);
        }
        args.push(outputName);

        await ffmpeg.run(...args);

        // Récupère le fichier final converti
        const data = ffmpeg.FS('readFile', outputName);
        const url = URL.createObjectURL(new Blob([data.buffer], { type: `audio/${outFormat}` }));
        
        // Téléchargement automatique
        const link = document.createElement('a');
        link.href = url;
        link.download = `audioconvert-${Date.now()}.${outFormat}`;
        link.click();

        downloadBtn.innerText = "✅ Succès !";
    } catch (error) {
        console.error("Erreur FFmpeg:", error);
        alert("Une erreur est survenue pendant la conversion.");
        downloadBtn.innerText = "❌ Erreur";
    } finally {
        setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.innerText = "📥 Convertir & Télécharger";
        }, 3000);
    }
});

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
