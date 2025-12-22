const { createFFmpeg, fetchFile } = FFmpeg;

// Configuration cruciale pour éviter l'erreur SharedArrayBuffer
const ffmpeg = createFFmpeg({ 
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js'
});

// Éléments UI
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
const bitrateGroup = document.getElementById('bitrate-group');

// Masquer le bitrate pour le WAV (format non-compressé)
formatSelect.addEventListener('change', () => {
    if (formatSelect.value === 'wav' || formatSelect.value === 'flac') {
        bitrateGroup.style.opacity = "0.5";
        bitrateGroup.style.pointerEvents = "none";
        fileSizeDisplay.innerText = "Calcul non disponible (Lossless)";
    } else {
        bitrateGroup.style.opacity = "1";
        bitrateGroup.style.pointerEvents = "all";
        updateEstimation();
    }
});

// --- GESTION FICHIER & ESTIMATION ---
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.innerText = file.name;
        audioControl.src = URL.createObjectURL(file);
        dropZone.style.display = 'none';
        previewContainer.style.display = 'grid';
    }
});

function updateEstimation() {
    if (audioControl.duration && formatSelect.value !== 'wav' && formatSelect.value !== 'flac') {
        const kbps = parseInt(bitrateRange.value);
        const sizeMb = (kbps * audioControl.duration) / 8000;
        fileSizeDisplay.innerText = `~${sizeMb.toFixed(1)} Mo`;
    }
}

bitrateRange.addEventListener('input', () => {
    bitrateValue.innerText = bitrateRange.value + " kbps";
    updateEstimation();
});

audioControl.onloadedmetadata = () => {
    const min = Math.floor(audioControl.duration / 60);
    const sec = Math.floor(audioControl.duration % 60);
    durationDisplay.innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    updateEstimation();
};

audioControl.ontimeupdate = () => {
    const percentage = (audioControl.currentTime / audioControl.duration) * 100;
    progressFill.style.width = percentage + "%";
};

// --- MOTEUR DE CONVERSION ---
downloadBtn.addEventListener('click', async () => {
    const file = upload.files[0];
    if (!file) return;

    downloadBtn.disabled = true;
    downloadBtn.innerText = "⏳ Initialisation...";

    try {
        // Chargement du moteur
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        const inputExt = file.name.split('.').pop();
        const outputExt = formatSelect.value;
        const outputName = `output.${outputExt}`;

        // Ecriture du fichier
        await ffmpeg.FS('writeFile', `input.${inputExt}`, await fetchFile(file));
        
        downloadBtn.innerText = "⚙️ Conversion en cours...";

        // EXECUTION DE LA COMMANDE
        // On retire les options qui pourraient forcer le multi-threading
        if (outputExt === 'mp3' || outputExt === 'ogg') {
            await ffmpeg.run('-i', `input.${inputExt}`, '-b:a', `${bitrateRange.value}k`, outputName);
        } else {
            await ffmpeg.run('-i', `input.${inputExt}`, outputName);
        }

        // Lecture du résultat
        const data = ffmpeg.FS('readFile', outputName);
        const url = URL.createObjectURL(new Blob([data.buffer], { type: `audio/${outputExt}` }));
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `audiopro-${Date.now()}.${outputExt}`;
        link.click();

        downloadBtn.innerText = "✅ Terminé !";
    } catch (e) {
        console.error(e);
        downloadBtn.innerText = "❌ Erreur de sécurité";
        alert("Votre navigateur bloque la conversion. Essayez sur Chrome ou désactivez vos extensions de sécurité.");
    } finally {
        downloadBtn.disabled = false;
    }
});

// Thème & Modal (restaurés)
document.getElementById('theme-switch').onclick = () => {
    document.documentElement.toggleAttribute('data-theme');
};
document.getElementById('help-btn').onclick = () => document.getElementById('help-modal').style.display = 'flex';
document.querySelector('.close-modal').onclick = () => document.getElementById('help-modal').style.display = 'none';
