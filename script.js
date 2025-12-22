/**
 * MultiConvert Pro
 * Traitement Image (Canvas) & Audio (FFmpeg.wasm)
 * Auteur: Micfri
 */

// --- NAVIGATION ---
function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

// --- LOGIQUE IMAGE ---
const upload = document.getElementById('upload');
const dropZone = document.getElementById('drop-zone');
const canvas = document.getElementById('main-canvas');
const previewContainer = document.getElementById('preview-container');

if (upload && canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const toleranceRange = document.getElementById('tolerance-range');
    const toleranceValue = document.getElementById('tolerance-value');
    const formatSelect = document.getElementById('format-select');
    const downloadBtn = document.getElementById('download-btn');
    const fileSizeDisplay = document.getElementById('file-size');
    const colorPreview = document.getElementById('color-preview');
    const inputW = document.getElementById('resize-w');
    const inputH = document.getElementById('resize-h');

    let imgElement = null;
    let ratio = 1;
    let targetColor = null;

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            imgElement = new Image();
            imgElement.onload = () => {
                ratio = imgElement.width / imgElement.height;
                if (inputW) inputW.value = imgElement.width;
                if (inputH) inputH.value = imgElement.height;
                targetColor = null;
                if (dropZone) dropZone.style.display = 'none';
                if (previewContainer) previewContainer.style.display = 'grid';
                processImage();
            };
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    upload.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    canvas.addEventListener('click', (e) => {
        if (!imgElement) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        targetColor = [pixel[0], pixel[1], pixel[2]];
        processImage();
    });

    function processImage() {
        if (!imgElement) return;
        const w = (inputW ? parseInt(inputW.value) : 0) || imgElement.width;
        const h = (inputH ? parseInt(inputH.value) : 0) || imgElement.height;
        canvas.width = w; canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(imgElement, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const tolerance = toleranceRange ? parseInt(toleranceRange.value) : 80;
        
        let rT, gT, bT;
        if (targetColor) { [rT, gT, bT] = targetColor; } 
        else { rT = data[0]; gT = data[1]; bT = data[2]; }
        if (colorPreview) colorPreview.style.backgroundColor = `rgb(${rT}, ${gT}, ${bT})`;

        for (let i = 0; i < data.length; i += 4) {
            const dist = Math.sqrt(Math.pow(data[i]-rT,2) + Math.pow(data[i+1]-gT,2) + Math.pow(data[i+2]-bT,2));
            if (dist < tolerance) data[i + 3] = 0;
        }
        ctx.putImageData(imgData, 0, 0);
    }

if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        const format = formatSelect ? formatSelect.value : 'image/png';
        
        if (format === 'image/x-icon') {
            // 1. On définit une taille haute définition (256x256 est le top pour ICO)
            // Ou on utilise la taille actuelle du canvas si elle est plus grande
            const size = Math.max(canvas.width, canvas.height, 256);
            
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCanvas.width = size;
            tempCanvas.height = size;

            // 2. Désactiver le lissage pour garder une icône nette si on agrandit
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';

            // 3. Dessiner l'image (centrée si ce n'est pas un carré)
            tempCtx.drawImage(canvas, 0, 0, size, size);
            
            const link = document.createElement('a');
            link.download = `icon-hd-${Date.now()}.ico`;
            
            // 4. Utiliser image/png avec qualité maximale (1.0)
            // Le format ICO moderne accepte parfaitement le PNG sans perte à l'intérieur
            link.href = tempCanvas.toDataURL('image/png', 1.0); 
            link.click();
        } else {
            const extension = format.split('/')[1];
            const link = document.createElement('a');
            link.download = `converti-${Date.now()}.${extension}`;
            link.href = canvas.toDataURL(format, 1.0);
            link.click();
        }
    });
}

    if (toleranceRange) {
        toleranceRange.addEventListener('input', () => {
            if (toleranceValue) toleranceValue.innerText = toleranceRange.value;
            processImage();
        });
    }
}

// --- LOGIQUE AUDIO ---
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: false });

// --- ÉCOUTEUR DE PROGRESSION AUDIO ---
ffmpeg.setProgress(({ ratio }) => {
    const progressFill = document.getElementById('audio-progress-fill');
    const progressBar = document.getElementById('audio-progress-bar'); // Le conteneur
    const statusText = document.getElementById('conv-status');

    // 1. On force l'affichage du conteneur dès que la progression commence
    if (progressBar) {
        progressBar.style.display = 'block';
    }
    
    const percentage = Math.round(ratio * 100);

    if (progressFill) {
        // 2. Mise à jour de la largeur
        progressFill.style.width = percentage + '%';
        
        // 3. Effet de glissement de couleur (Violet -> Vert)
        progressFill.style.backgroundPosition = (100 - percentage) + '% 0%';
        
        // 4. Changement de lueur à la fin
        if (percentage > 80) {
            progressFill.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.6)";
        }
    }

    // 5. Mise à jour du texte
    if (statusText) {
        statusText.innerText = `Conversion : ${percentage}%`;
    }
});

const audioUpload = document.getElementById('audio-upload');
const convertAudioBtn = document.getElementById('convert-audio-btn');
const audioStatus = document.getElementById('conv-status');
const audioDownloadDiv = document.getElementById('audio-download-link');

if (audioUpload) {
    audioUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('audio-processing').style.display = 'grid';
            document.getElementById('audio-filename').innerText = file.name;
            if (audioStatus) audioStatus.innerText = "Prêt à convertir";
            // Réinitialise la barre
            document.getElementById('audio-progress-fill').style.width = '0%';
            document.getElementById('audio-progress-bar').style.display = 'none';
        }
    });
}

if (convertAudioBtn) {
    convertAudioBtn.addEventListener('click', async () => {
        const file = audioUpload.files[0];
        if (!file) return;
        const outFormat = document.getElementById('audio-format-select').value;
        
        try {
            convertAudioBtn.disabled = true;
            if (audioStatus) audioStatus.innerText = "⏳ Chargement...";
            if (!ffmpeg.isLoaded()) await ffmpeg.load();
            
            ffmpeg.FS('writeFile', 'input', await fetchFile(file));
            await ffmpeg.run('-i', 'input', `output.${outFormat}`);
            
const data = ffmpeg.FS('readFile', `output.${outFormat}`);
const url = URL.createObjectURL(new Blob([data.buffer], { type: `audio/${outFormat}` }));

if (audioDownloadDiv) {
    audioDownloadDiv.innerHTML = `
        <a href="${url}" download="audio_converti.${outFormat}" class="btn-primary" style="text-decoration:none; display:block; text-align:center;">
            📥 Télécharger .${outFormat.toUpperCase()}
        </a>`;
}
            if (audioStatus) audioStatus.innerText = "✅ Terminé !";
        } catch (err) {
            console.error(err);
            if (audioStatus) audioStatus.innerText = "❌ Erreur";
        } finally {
            convertAudioBtn.disabled = false;
        }
    });
}

// --- THÈME & ÉLÉMENTS COMMUNS ---
function applyTheme(theme) {
    const themeBtn = document.getElementById('theme-switch');
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeBtn) themeBtn.innerText = "☀️ Mode Clair";
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeBtn) themeBtn.innerText = "🌙 Mode Sombre";
    }
}

const themeSwitch = document.getElementById('theme-switch');
if (themeSwitch) {
    themeSwitch.addEventListener('click', () => {
        const newTheme = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}
if (localStorage.getItem('theme') === 'dark') applyTheme('dark');

// Sécurisation Aide/Partage (ces IDs doivent être dans le HTML pour fonctionner)
const shareBtn = document.getElementById('share-link');
if (shareBtn) {
    shareBtn.onclick = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Lien copié ! 📋");
    };
}

// Rendre les badges de format cliquables
document.querySelectorAll('.badge').forEach(badge => {
    badge.style.cursor = 'pointer'; // Curseur main au survol
    badge.addEventListener('click', () => {
        const format = badge.innerText.toLowerCase();
        const select = document.getElementById('audio-format-select');
        
        if (select) {
            select.value = format;
            // Petit effet visuel pour confirmer la sélection
            badge.style.transform = 'scale(0.95)';
            setTimeout(() => badge.style.transform = 'scale(1)', 100);
        }
    });
});
