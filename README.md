# ✨ ImageConvert Pro

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Build: Passing](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Tech: Vanilla JS](https://img.shields.io/badge/Tech-Vanilla%20JS-orange.svg)

**ImageConvert Pro** est un studio de retouche d'image ultra-léger basé sur navigateur. Il permet de détourer des images (suppression de fond), de les redimensionner en temps réel et de les convertir dans différents formats (PNG, JPG, WebP, BMP) sans aucun serveur externe.

## 🚀 Fonctionnalités

* **Détourage Intelligent (Pipette Magique) :** Supprimez automatiquement le fond uni ou cliquez sur n'importe quelle couleur de l'image pour la rendre transparente.
* **Redimensionnement Dynamique :** Changez la largeur ou la hauteur avec maintien des proportions et prévisualisation instantanée.
* **Estimation du Poids :** Visualisez le poids du fichier final (Ko/Mo) avant le téléchargement selon le format choisi.
* **Multi-Format :** Exportez vos créations en PNG (transparence), JPEG (fond blanc), WebP ou BMP.
* **Confidentialité Totale :** Toutes les opérations sont effectuées localement dans votre navigateur. Vos images ne sont jamais envoyées sur un serveur.


## 📖 Comment l'utiliser ?

1.  **Charger :** Glissez-déposez une image dans la zone centrale ou cliquez pour parcourir.
2.  **Détourer :** * L'outil détecte par défaut la couleur du coin supérieur gauche.
    * **Astuce :** Cliquez directement sur une zone colorée de l'image pour définir une nouvelle couleur à supprimer.
    * Ajustez le curseur **Tolérance** pour affiner le résultat.
3.  **Redimensionner :** Modifiez les valeurs dans la section "Dimensions". L'aperçu s'adapte automatiquement.
4.  **Exporter :** Choisissez votre format et cliquez sur **Télécharger**.

## 💻 Technologies utilisées

* **HTML5 / CSS3 :** Structure et design moderne avec la police *Plus Jakarta Sans*.
* **JavaScript (Vanilla) :** Manipulation du `Canvas API` pour le traitement de l'image pixel par pixel.
* **Flexbox & Grid :** Pour une interface responsive et organisée.

## 📝 Licence

Ce projet est sous licence **MIT**. Vous êtes libre de l'utiliser, de le modifier.
