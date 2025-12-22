const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

const upload = document.getElementById('upload');
const dropZone = document.getElementById('drop-zone');
const previewContainer = document.getElementById('preview-container');
const audioControl = document.getElementById('main-audio');
const fileNameDisplay = document.getElementById('audio-filename');
const progressFill = document.getElementById('audio-progress-fill');
const bitrateRange = document.getElementById('bitrate-range');
const bitrateValue = document.getElementById('bitrate-value');
const downloadBtn = document.getElementById('download-btn');
const estSizeDisplay = document.getElementById('est-size');

// --- 1. GESTION DU FICHIER ENTRANT ---
upload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.innerText = file.name;
        audioControl.src = URL.createObjectURL(file);
        dropZone.style.display = 'none';
        previewContainer.style.display = 'grid';
        updateEstimation();
    }
});

// --- 2. ESTIMATION DE LA TAILLE ---
function updateEstimation() {
    if (audioControl.duration) {
        const kbps = parseInt(bitrateRange.value);
        const duration = audioControl.duration;
        const sizeMb = (kbps * duration) / 8000;
        estSizeDisplay.innerText = `~${sizeMb.toFixed(1)} Mo`;
    }
}

bitrateRange.addEventListener('input', () => {
    bitrateValue.innerText = bitrateRange.value + " kbps";
    updateEstimation();
});

audioControl.addEventListener('loadedmetadata', updateEstimation);

// --- 3. LE MOTEUR DE CONVERSION (Cœur du projet) ---
downloadBtn.addEventListener('click', async () => {
    const file = upload.files[0];
    const targetBitrate = bitrateRange.value;
    
    downloadBtn.disabled = true;
    downloadBtn.innerText = "⏳ Initialisation...";
    progressFill.style.width = "10%";

    try {
        // Charger le moteur s'il ne l'est pas
        if (!ffmpeg.isLoaded()) await ffmpeg.load();
        
        progressFill.style.width = "25%";
        downloadBtn.innerText = "⚙️ Encodage en cours...";

        // Écrire le fichier dans la mémoire virtuelle
        const inputExt = file.name.split('.').pop();
        ffmpeg.FS('writeFile', 'input.' + inputExt, await fetchFile(file));

        // EXECUTION DE LA COMMANDE FFmpeg
        // -i input : fichier source
        // -b:a 320k : force le bitrate (C'est ça qui réduit le poids !)
        // output.mp3 : fichier de sortie
        await ffmpeg.run('-i', 'input.' + inputExt, '-b:a', targetBitrate + 'k', 'output.mp3');

        // Lire le fichier converti
        const data = ffmpeg.FS('readFile', 'output.mp3');
        
        // Créer le lien de téléchargement
        const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `audio-pro-${targetBitrate}kbps.mp3`;
        link.click();

        progressFill.style.width = "100%";
        downloadBtn.innerText = "✅ Terminé !";
        
        // Nettoyage mémoire
        ffmpeg.FS('unlink', 'input.' + inputExt);
        ffmpeg.FS('unlink', 'output.mp3');

    } catch (error) {
        console.error(error);
        alert("Erreur lors de la conversion. Vérifiez la console.");
        downloadBtn.innerText = "❌ Erreur";
    } finally {
        setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.innerText = "📥 Lancer la conversion";
        }, 3000);
    }
});

// Thème switch
document.getElementById('theme-switch').addEventListener('click', () => {
    document.documentElement.toggleAttribute('data-theme');
});
