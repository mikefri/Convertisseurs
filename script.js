const upload = document.getElementById('upload');
const uploadLabel = document.getElementById('upload-label');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download-btn');
const removeBgBtn = document.getElementById('remove-bg-btn');
const loadingMsg = document.getElementById('loading-msg');
const resetBtn = document.getElementById('reset-btn');
const previewContainer = document.getElementById('preview-container');
const imageDisplay = document.getElementById('image-display');
const fileNameDisplay = document.getElementById('file-name');

let currentFileName = "";

// 1. Gérer l'upload
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentFileName = file.name.split('.').slice(0, -1).join('.');
    fileNameDisplay.innerText = file.name;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => updateUIWithImage(img);
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

function updateUIWithImage(img) {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    imageDisplay.src = canvas.toDataURL();
    previewContainer.style.display = 'block';
    uploadLabel.style.display = 'none';
}

// 2. Suppression de l'arrière-plan
removeBgBtn.addEventListener('click', async () => {
    removeBgBtn.disabled = true;
    loadingMsg.style.display = 'block';
    removeBgBtn.innerText = "⏳ Chargement de l'IA...";

    try {
        // On indique à l'IA d'utiliser le CDN jsDelivr pour ses fichiers internes (.wasm)
        const config = {
            publicPath: "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/",
        };

        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        removeBgBtn.innerText = "🧠 Analyse de l'image...";
        
        // Exécution
        const resultBlob = await imglyRemoveBackground(blob, config);
        
        const newImg = new Image();
        newImg.onload = () => {
            updateUIWithImage(newImg);
            loadingMsg.style.display = 'none';
            removeBgBtn.disabled = false;
            removeBgBtn.innerText = "✨ Supprimer l'arrière-plan (IA)";
        };
        newImg.src = URL.createObjectURL(resultBlob);
    } catch (err) {
        console.error(err);
        alert("L'IA a besoin de charger des composants (30Mo). Si cela échoue, rafraîchissez la page et réessayez.");
        removeBgBtn.disabled = false;
        loadingMsg.style.display = 'none';
        removeBgBtn.innerText = "✨ Supprimer l'arrière-plan (IA)";
    }
});

// 3. Téléchargement
downloadBtn.addEventListener('click', () => {
    const format = document.getElementById('format-select').value;
    const extension = format.split('/')[1].replace('jpeg', 'jpg');
    const link = document.createElement('a');
    link.download = `${currentFileName}-converti.${extension}`;
    link.href = canvas.toDataURL(format, 0.9);
    link.click();
});

// 4. Reset
resetBtn.addEventListener('click', () => {
    previewContainer.style.display = 'none';
    uploadLabel.style.display = 'inline-block';
    upload.value = "";
});
