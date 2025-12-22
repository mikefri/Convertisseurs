/**
 * AudioConvert Pro - scriptaudio.js
 * Gère l'interface, la préécoute et la conversion réelle
 */

const { createFFmpeg, fetchFile } = FFmpeg;

// Initialisation de FFmpeg 0.11.6
// Note : Le coi-serviceworker.js permettra à SharedArrayBuffer d'être défini
const ffmpeg = createFFmpeg({ log: true });

// --- SÉLECTEURS UI ---
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

// --- 1. CHARGEMENT ET PRÉÉCOUTE ---
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.innerText = file.name;
        // Création de l'URL pour que le lecteur <audio> puisse lire le fichier
        const url = URL.createObjectURL(file);
        audioControl.src = url;
        
        // Affichage de la zone d'édition
        if(dropZone) dropZone.style.display = 'none';
        if(previewContainer) previewContainer.style.display = 'grid';
    }
});

// Mise à jour de la barre de progression (violette) pendant la lecture
audioControl.ontimeupdate = () => {
    if (audioControl.duration) {
        const percentage = (audioControl.currentTime / audioControl.duration) * 100;
        progressFill.style.width = percentage + "%";
    }
};

// Affichage de la durée dès que le fichier est chargé
audioControl.onloadedmetadata = () => {
    const min = Math.floor(audioControl.duration / 60);
    const sec = Math.floor(audioControl.duration % 60);
    durationDisplay.innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    updateEstimation();
};

// --- 2. GESTION DU BITRATE ET ESTIMATION ---
function updateEstimation() {
    const format = formatSelect.value;
    // On n'estime que pour les formats compressés (MP3, OGG, M4A, AAC)
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

// --- 3. CONVERSION RÉELLE (L'action du bouton) ---
downloadBtn.addEventListener('click', async () => {
    const file = upload.files[0];
    if (!file) return;

    const outFormat = formatSelect.value;
    const bitrate = bitrateRange.value;

    downloadBtn.disabled = true;
    downloadBtn.innerText = "⏳ Chargement moteur...";
    
    try {
        // C'est ici que SharedArrayBuffer est requis
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        const inputExt = file.name.split('.').pop();
        const inputName = `input.${inputExt}`;
        const outputName = `output.${outFormat}`;

        // Charger le fichier dans le système FFmpeg
        ffmpeg.FS('writeFile', inputName, await fetchFile(file));
        
        downloadBtn.innerText = "⚙️ Encodage en cours...";
        
        let args = ['-i', inputName];
        
        // Appliquer le bitrate si le format n'est pas WAV ou FLAC
        if (['mp3', 'ogg', 'm4a', 'aac'].includes(outFormat)) {
            args.push('-b:a', `${bitrate}k`);
        }
        
        args.push(outputName);

        // Lancer la conversion réelle
        await ffmpeg.run(...args);

        // Récupérer le fichier converti
        const data = ffmpeg.FS('readFile', outputName);
        const url = URL.createObjectURL(new Blob([data.buffer], { type: `audio/${outFormat}` }));
        
        // Déclencher le téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = `audioconvert-${Date.now()}.${outFormat}`;
        link.click();

        downloadBtn.innerText = "✅ Terminé !";
    } catch (error) {
        console.error("Erreur FFmpeg:", error);
        alert("Erreur de sécurité : SharedArrayBuffer n'est pas activé. Vérifiez que coi-serviceworker.js est bien à la racine de votre projet GitHub.");
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
if(themeBtn) {
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
}
