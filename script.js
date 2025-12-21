const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const formatSelect = document.getElementById('format-select');
const previewContainer = document.getElementById('preview-container');
const fileNameDisplay = document.getElementById('file-name');
const imageDisplay = document.getElementById('image-display');

let currentFileName = "";

// Chargement de l'image
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentFileName = file.name.split('.').slice(0, -1).join('.');
    fileNameDisplay.innerText = `Fichier : ${file.name}`;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Afficher l'aperçu visuel
            imageDisplay.src = event.target.result;

            // Préparer le canvas pour la conversion
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            previewContainer.style.display = 'block';
            upload.parentElement.querySelector('.upload-label').style.display = 'none';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Conversion et Téléchargement
downloadBtn.addEventListener('click', () => {
    const format = formatSelect.value;
    const extension = format.split('/')[1].replace('jpeg', 'jpg');
    
    const dataUrl = canvas.toDataURL(format, 0.9);
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${currentFileName}-converti.${extension}`;
    link.click();
});

// Bouton Effacer
resetBtn.addEventListener('click', () => {
    previewContainer.style.display = 'none';
    upload.parentElement.querySelector('.upload-label').style.display = 'inline-block';
    upload.value = "";
});
