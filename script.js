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
            const link = document.createElement('a');
            link.download = `converti-${Date.now()}.${format.split('/')[1]}`;
            link.href = canvas.toDataURL(format);
            link.click();
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

const audioUpload = document.getElementById('audio-upload');
const convertAudioBtn = document.getElementById('convert-audio-btn');
const audioStatus = document.getElementById('conv-status');
const audioDownloadDiv = document.getElementById('audio-download-link');

if (audioUpload) {
    audioUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const proc = document.getElementById('audio-processing');
            if (proc) proc.style.display = 'grid';
            const nameDisp = document.getElementById('audio-filename');
            if (nameDisp) nameDisp.innerText = file.name;
            if (audioStatus) audioStatus.innerText = "Prêt à convertir";
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
            if (audioStatus) audioStatus.innerText = "⏳ Chargement du moteur...";
            if (!ffmpeg.isLoaded()) await ffmpeg.load();
            
            if (audioStatus) audioStatus.innerText = "⚙️ Conversion en cours...";
            ffmpeg.FS('writeFile', 'input', await fetchFile(file));
            await ffmpeg.run('-i', 'input', `output.${outFormat}`);
            
            const data = ffmpeg.FS('readFile', `output.${outFormat}`);
            const url = URL.createObjectURL(new Blob([data.buffer], { type: `audio/${outFormat}` }));
            
            if (audioDownloadDiv) {
                audioDownloadDiv.innerHTML = `<a href="${url}" download="audio.${outFormat}" class="btn-primary" style="text-decoration:none; display:block; text-align:center;">📥 Télécharger .${outFormat.toUpperCase()}</a>`;
            }
            if (audioStatus) audioStatus.innerText = "✅ Terminé !";
        } catch (err) {
            console.error(err);
            if (audioStatus) audioStatus.innerText = "❌ Erreur de conversion";
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
