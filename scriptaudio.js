/**
 * AudioConvert Pro - Script Final
 * Gère la lecture, l'UI et la conversion réelle via FFmpeg
 */

const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

// --- ÉLÉMENTS UI ---
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

// --- 1. GESTION DU FICHIER & LECTURE ---
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.innerText = file.name;
        // Création de l'URL pour la préécoute locale
        const url = URL.createObjectURL(file);
        audioControl.src = url;
        
        // Affichage de l'interface d'édition
        dropZone.style.display = 'none';
        previewContainer.style.display = 'grid';
    }
});

// Mise à jour de la barre de progression pendant la lecture
audioControl.ontimeupdate = () => {
    if (audioControl.duration) {
        const percentage = (audioControl.currentTime / audioControl.duration) * 100;
        progressFill.style.width = percentage + "%";
    }
};

// Affichage de la durée totale
audioControl.onloadedmetadata = () => {
    const min = Math.floor(audioControl.duration / 60);
    const sec = Math.floor(audioControl.duration % 60);
    durationDisplay.innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    updateEstimation();
};

// --- 2. ESTIMATION DE LA TAILLE ---
function updateEstimation() {
    const format = formatSelect.value;
    if (audioControl.duration && format !== 'wav' && format !== 'flac') {
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

// --- 3. MOTEUR DE CONVERSION (FFmpeg) ---
downloadBtn.addEventListener('click', async () => {
    const file = upload.files[0];
    if (!file) return;

    const outFormat = formatSelect.value;
    const bitrate = bitrateRange.value;

    downloadBtn.disabled = true;
    downloadBtn.innerText = "⏳ Initialisation moteur...";
    
    try {
        // Chargement du moteur (débloqué par ton coi-serviceworker.js)
        if (!ffmpeg.isLoaded()) await ffmpeg.load();

        const inputExt = file.name.split('.').pop();
        const inputName = `input.${inputExt}`;
        const outputName = `output.${outFormat}`;

        // Écriture du fichier dans le système virtuel
        ffmpeg.FS('writeFile', inputName, await fetchFile(file));
        
        downloadBtn.innerText = "⚙️ Encodage réel...";
        
        // Préparation de la commande FFmpeg
        let args = ['-i', inputName];
        
        // On n'applique le bitrate que pour les formats compressés
        if (outFormat !== 'wav' && outFormat !== 'flac') {
            args.push('-b:a', `${bitrate}k`);
        }
        
        args.push(outputName);

        // Lancement de la conversion
        await ffmpeg.run(...args);

        // Lecture et téléchargement du résultat
        const data = ffmpeg.FS('readFile', outputName);
        const url = URL.createObjectURL(new Blob([data.buffer], { type: `audio/${outFormat}` }));
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `audiopro-${Date.now()}.${outFormat}`;
        link.click();

        downloadBtn.innerText = "✅ Terminé !";
    } catch (error) {
        console.error(error);
        alert("Erreur : Assurez-vous que coi-serviceworker.js est bien présent sur votre serveur.");
        downloadBtn.innerText = "❌ Erreur";
    } finally {
        setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.innerText = "📥 Convertir & Télécharger";
        }, 3000);
    }
});

// --- 4. THÈME SOMBRE ---
const themeBtn = document.getElementById('theme-switch');
themeBtn.onclick = () => {
    const isDark = document.documentElement.hasAttribute('data-theme');
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        themeBtn.innerText = "🌙 Mode Sombre";
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.innerText = "☀️ Mode Clair";
    }
};
