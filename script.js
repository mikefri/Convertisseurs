const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download-btn');
const formatSelect = document.getElementById('format-select');
const previewContainer = document.getElementById('preview-container');
const fileNameDisplay = document.getElementById('file-name');

let currentFileName = "";

// 1. Gérer l'upload du fichier
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Récupérer le nom du fichier sans extension
    currentFileName = file.name.split('.').slice(0, -1).join('.');
    fileNameDisplay.innerText = `Fichier prêt : ${file.name}`;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Préparer le canvas avec les dimensions de l'image
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            previewContainer.style.display = 'block';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// 2. Gérer la conversion et le téléchargement
downloadBtn.addEventListener('click', () => {
    const format = formatSelect.value; // ex: image/jpeg
    const extension = format.split('/')[1]; // ex: jpeg
    
    // Créer l'image convertie (Qualité 0.9 pour un bon ratio poids/qualité)
    const dataUrl = canvas.toDataURL(format, 0.9);
    
    // Déclencher le téléchargement
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${currentFileName}-converti.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
