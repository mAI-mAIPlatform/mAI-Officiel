# Utilisation Multimodale mAI

## Introduction
mAI n'est pas seulement du texte. Il peut comprendre et générer des images, de l'audio, de la vidéo et même des diagrammes. Ce guide explique toutes les capacités multimodales.

---

## Capacités multimodales disponibles

| Modalité | Entrée | Sortie |
|----------|--------|--------|
| 🖼️ Images | ✅ Oui | ✅ Oui |
| 🎤 Audio | ✅ Oui | ✅ Oui |
| 🎥 Vidéo | ✅ Oui | ⏳ Bientôt |
| 📊 Diagrammes | ✅ Oui | ✅ Oui |
| 🎨 Schémas | ✅ Oui | ✅ Oui |
| 📑 Documents scannés | ✅ Oui | ❌ Non |

> ✅ Toutes ces fonctionnalités sont disponibles nativement dans tous les canevas.

---

## Étape 1 : Traitement d'images

mAI peut comprendre le contenu de n'importe quelle image.

### Comment utiliser :
1. Glissez-déposez une image dans un canevas
2. Ou collez une image depuis votre presse-papiers
3. Posez votre question directement

### Exemples de questions :
```
"Décris ce qui est sur cette image"
"Extrais tout le texte de ce document scanné"
"Quels sont les chiffres sur ce graphique ?"
"Corrige les erreurs dans ce schéma"
"Réécris ce texte manuscrit en propre"
"Explique ce diagramme d'architecture"
```

### Formats supportés :
JPG, PNG, GIF, WebP, BMP, SVG  
Taille maximum : 20MB par image

---

## Étape 2 : Génération d'images

mAI intègre DALL-E 3 et Stable Diffusion pour générer des images de haute qualité.

### Méthode 1 : Commande simple
```
/génère-image "Un chat programmeur qui code sur un ordinateur portable, style cartoon, haute qualité"
```

### Méthode 2 : Description détaillée
Pour de meilleurs résultats, soyez très précis :
```
Génère une image :
- Sujet : Bureau moderne d'une startup IA
- Style : Photoréaliste, lumière naturelle
- Composition : Vue large, profondeur de champ
- Couleurs : Bleu et blanc, tons chauds
- Résolution : 4K
- Style artistique : Inspiré de Unsplash
```

### Paramètres disponibles :
- Taille : 1024x1024, 1792x1024, 1024x1792
- Style : Vivid / Naturel
- Qualité : Standard / HD
- Nombre : 1-4 images par génération

---

## Étape 3 : Traitement audio

mAI peut transcrire et analyser n'importe quel fichier audio.

### Formats supportés :
MP3, WAV, M4A, OGG, FLAC  
Durée maximum : 2 heures par fichier

### Fonctionnalités :
✅ Transcription automatique en 99 langues  
✅ Identification des intervenants  
✅ Horodatage précis mot par mot  
✅ Extraction des points clés  
✅ Génération de résumé  
✅ Détection des émotions  
✅ Traduction automatique

### Exemple d'utilisation :
1. Upload votre enregistrement de réunion
2. mAI transcrit automatiquement
3. Vous demandez :
```
"Fais un résumé de cette réunion en 3 points clés"
"Liste toutes les actions décidées avec leurs responsables"
"Extrais la partie où on parle du budget"
```

---

## Étape 4 : Génération audio

mAI peut générer de la voix naturelle de haute qualité.

### Commande :
```
/génère-audio "Bienvenue sur mAI, la plateforme IA pour les équipes. Découvrez comment nous pouvons vous aider à automatiser votre travail."
```

### Voix disponibles :
| Voix | Langue | Style |
|------|--------|-------|
| Léa | Français | Naturelle, chaleureuse |
| Lucas | Français | Professionnel, autoritaire |
| Emma | Français | Jeune, dynamique |
| Hugo | Français | Voix profonde |
| + 30 autres voix dans 20 langues |

### Paramètres :
- Vitesse : 0.5x à 2x
- Ton : -50% à +50%
- Format : MP3, WAV, OGG

---

## Étape 5 : Diagrammes et schémas

mAI peut générer et modifier des diagrammes professionnels en langage naturel.

### Types de diagrammes supportés :
- Organigrammes
- Diagrammes de flux
- Architecture système
- Mind maps
- Diagrammes de séquence
- Diagrammes Gantt
- Modèles UML

### Exemple :
```
Génère un organigramme pour une startup de 15 personnes :
- Fondateur / PDG
  - Directeur Technique
    - 3 développeurs
    - 1 DevOps
  - Directeur Marketing
    - 2 marketeurs
    - 1 Community Manager
  - Directeur Commercial
    - 3 commerciaux
  - RH & Admin
```

> ✅ Les diagrammes sont générés en SVG, vous pouvez donc les modifier par la suite.

---

## Étape 6 : Traitement vidéo (Bêta)

La fonctionnalité vidéo est actuellement en bêta pour les utilisateurs Pro :

### Ce que vous pouvez faire :
1. Upload une vidéo
2. mAI extrait l'audio et les images clés
3. Vous pouvez poser des questions sur le contenu :
```
"Résume cette vidéo en 5 points"
"A quelle minute parle-t-on du lancement produit ?"
"Extrais toutes les démonstrations produit"
"Transcris tous les sous-titres"
```

> 🚧 Limite bêta : 10 minutes par vidéo, 5 vidéos par mois.

---

## Bonnes pratiques

### 🖼️ Pour les images
1. Utilisez des images de bonne qualité et bien cadrées
2. Soyez précis dans vos questions
3. Pour la génération : plus de détails = meilleur résultat
4. Vous pouvez demander des modifications itératives : "Rends le chat plus mignon"

### 🎤 Pour l'audio
1. Évitez les bruits de fond pour une meilleure transcription
2. Indiquez le nombre d'intervenants si vous le connaissez
3. Pour la génération audio : testez plusieurs voix pour trouver la bonne

### 📊 Pour les diagrammes
1. Commencez simple, ajoutez des détails progressivement
2. Demandez à mAI de corriger et modifier après génération
3. Exportez en SVG pour une modification ultérieure dans un outil externe

---

## Limites et quotas

| Fonctionnalité | Gratuit | Pro | Entreprise |
|----------------|---------|-----|------------|
| Traitement images | 50/jour | 500/jour | Illimité |
| Génération images | 10/jour | 100/jour | Illimité |
| Traitement audio | 1h/mois | 10h/mois | Illimité |
| Génération audio | 10min/mois | 100min/mois | Illimité |
| Diagrammes | Illimité | Illimité | Illimité |

---

## API multimodale

Toutes les capacités multimodales sont disponibles via l'API :

```javascript
// Analyser une image
const result = await fetch('https://api.mai.app/v1/multimodal/analyze-image', {
  method: 'POST',
  body: formData,
  headers: { 'Authorization': 'Bearer ' + API_KEY }
});

// Générer une image
const image = await fetch('https://api.mai.app/v1/multimodal/generate-image', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "Un chat programmeur",
    size: "1024x1024",
    quality: "hd"
  })
});
```
