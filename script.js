/**
 * MultiConvert Pro
 * Logiciel de traitement Image (Canvas) & Audio (FFmpeg.wasm)
 */

// --- SÉLECTEURS NAVIGATION ---
function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// --- LOGIQUE IMAGE (VOTRE CODE ACTUEL) ---
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
const colorPreview = document.getElementById('color-preview');
const inputW = document.getElementById('resize-w');
const inputH = document.getElementById('resize-h');
const checkRatio = document.getElementById('aspect-ratio');

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
            inputW.value = imgElement.width;
            inputH.value = imgElement.height;
            targetColor = null;
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
    const w = parseInt(inputW.value) || imgElement.width;
    const h = parseInt(inputH.value) || imgElement.height;
    canvas.width = w; canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imgElement, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const tolerance = parseInt(toleranceRange.value);
    let rT, gT, bT;
    if (targetColor) { [rT, gT, bT] = targetColor; } 
    else { rT = data[0]; gT = data[1]; bT = data[2]; }
    if (colorPreview) colorPreview.style.backgroundColor = `rgb(${rT}, ${gT}, ${bT})`;

    for (let i = 0; i < data.length; i += 4) {
        const dist = Math.sqrt(Math.pow(data[i]-rT,2) + Math.pow(data[i+1]-gT,2) + Math.pow(data[i+2]-bT,2));
        if (dist < tolerance) data[i + 3] = 0;
    }
    ctx.putImageData(imgData, 0, 0);
    estimateSize();
}

function estimateSize() {
    const dataUrl = canvas.toDataURL(formatSelect.value, 0.9);
    const sizeInBytes = Math.round((dataUrl.length - 22) * 3 / 4);
    fileSizeDisplay.innerText = sizeInBytes < 1024 ? sizeInBytes + " o" : (sizeInBytes / 1024).toFixed(1) + " Ko";
}

// --- LOGIQUE AUDIO (NOUVEAU) ---
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: false });

const audioUpload = document.getElementById('audio-upload');
const convertAudioBtn = document.getElementById('convert-audio-btn');
const audioStatus = document.getElementById('conv-status');
const audioDownloadDiv = document.getElementById('audio-download-link');

audioUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('audio-processing').style.display = 'grid';
        document.getElementById('audio-filename').innerText = file.name;
        audioDownloadDiv.innerHTML = ''; 
        audioStatus.innerText = "Prêt à convertir";
    }
});

convertAudioBtn.addEventListener('click', async () => {
    const file = audioUpload.files[0];
    if (!file) return;

    const outFormat = document.getElementById('audio-format-select').value;
    
    try {
        convertAudioBtn.disabled = true;
        audioStatus.innerText = "⏳ Chargement du moteur (10 Mo)...";
        
        if (!ffmpeg.isLoaded()) await ffmpeg.load();
        
        audioStatus.innerText = "⚙️ Conversion en cours...";
        ffmpeg.FS('writeFile', 'input_file', await fetchFile(file));
        
        await ffmpeg.run('-i', 'input_file', `output.${outFormat}`);
        
        const data = ffmpeg.FS('readFile', `output.${outFormat}`);
        const url = URL.createObjectURL(new Blob([data.buffer], { type: `audio/${outFormat}` }));
        
        audioDownloadDiv.innerHTML = `<a href="${url}" download="converti-${Date.now()}.${outFormat}" class="btn-primary" style="text-decoration:none; display:block; text-align:center;">⬇️ Télécharger .${outFormat.toUpperCase()}</a>`;
        audioStatus.innerText = "✅ Terminé !";
    } catch (err) {
        console.error(err);
        audioStatus.innerText = "❌ Erreur de conversion";
    } finally {
        convertAudioBtn.disabled = false;
    }
});

// --- LOGIQUE COMMUNE (THÈME, AIDE, PARTAGE) ---
const themeBtn = document.getElementById('theme-switch');
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.innerText = "☀️ Mode Clair";
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeBtn.innerText = "🌙 Mode Sombre";
    }
}

themeBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
});

if (localStorage.getItem('theme') === 'dark') applyTheme('dark');

// Aide & Partage (Vos fonctions conservées)
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
if (helpBtn) helpBtn.onclick = () => helpModal.style.display = "flex";
document.querySelector('.close-modal').onclick = () => helpModal.style.display = "none";

document.getElementById('share-link').onclick = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Lien copié ! 📋");
};