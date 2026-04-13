# Bibliothèque de Modèles mAI

## Introduction
La Bibliothèque de Modèles contient des centaines de canevas, agents et workflows prêts à l'emploi créés par la communauté et l'équipe mAI. Gagnez des heures en commençant par un modèle plutôt que depuis zéro.

---

## Parcourir la bibliothèque

1. Allez dans **"Modèles"** dans le menu principal
2. Filtrez par catégorie :
   - 📈 Business
   - 💻 Développement
   - 📝 Rédaction
   - 🎓 Formation
   - 📊 Marketing
   - 🏭 Productivité
   - 🎨 Création
3. Triez par :
   - Plus populaires
   - Plus récents
   - Mieux notés
   - Officiels mAI

> ✅ Plus de 500 modèles disponibles et mis à jour chaque semaine.

---

## Catégories principales

### 📈 Business
- Prévision de chiffre d'affaires
- Analyse de rentabilité
- Business plan automatisé
- Évaluation de risques
- Gestion de projets

### 💻 Développement
- Revue de code automatique
- Génération de documentation API
- Plan de test
- Debugging assistant
- Architecture système

### 📝 Rédaction
- Emails professionnels
- Rapports d'activité
- Articles de blog
- Offres commerciales
- Discours et présentations

### 🎓 Formation
- Plan de cours
- Exercices et quiz
- Fiches de révision
- Évaluation des compétences
- Programme de formation

---

## Étape 1 : Utiliser un modèle

1. Trouvez le modèle qui correspond à votre besoin
2. Cliquez sur **"Aperçu"** pour voir ce qu'il contient
3. Lisez la description et les instructions
4. Cliquez sur **"Utiliser ce modèle"**
5. Remplissez les paramètres demandés
6. ✅ Votre canevas pré-rempli est prêt !

> 💡 La plupart des modèles sont personnalisables à 100% après utilisation.

---

## Étape 2 : Modèles avec paramètres

Certains modèles intelligents vous posent des questions pour s'adapter :

### Exemple : Modèle Business Plan
```
🤖 Je vais vous aider à créer votre business plan. Répondez à ces quelques questions :

1. Quel est le nom de votre entreprise ?
2. Dans quel secteur êtes-vous ?
3. Quel est votre modèle économique ?
4. Qui sont vos principaux concurrents ?

⏱️ Génération du business plan en cours...
✅ Terminé ! Votre business plan de 15 pages est prêt.
```

---

## Étape 3 : Créer votre propre modèle

Si vous avez créé un canevas utile, vous pouvez le partager avec la communauté :

1. Ouvrez le canevas à transformer en modèle
2. Cliquez sur **"..." → "Publier comme modèle"**
3. Remplissez les informations :
   - Nom clair et descriptif
   - Description détaillée
   - Catégorie
   - Tags
   - Instructions d'utilisation
4. Choisissez la visibilité :
   - Privé : Seulement vous et votre équipe
   - Public : Toute la communauté mAI
5. Soumettez pour validation

---

## Étape 4 : Modèles d'équipe

Pour les équipes Pro et Entreprise, vous pouvez avoir une bibliothèque privée :

1. Allez dans **"Modèles" → "Équipe"**
2. Tous les modèles publiés par votre équipe sont là
3. Organisez-les en dossiers
4. Définissez qui peut créer et modifier des modèles
5. Rendez certains modèles obligatoires pour les nouveaux projets

> 💡 Idéal pour standardiser les processus dans votre entreprise.

---

## Modèles officiels mAI

Les modèles créés par l'équipe mAI sont vérifiés, maintenus et garantis fonctionnels :

| Modèle | Note | Utilisations |
|--------|------|--------------|
| 📝 Rapport d'activité mensuel | ⭐ 4.9/5 | 12 450 |
| 💼 Offre commerciale | ⭐ 4.8/5 | 8 920 |
| ✅ Liste de vérification lancement produit | ⭐ 4.9/5 | 6 730 |
| 📊 Analyse de données de ventes | ⭐ 4.7/5 | 5 210 |
| 🎯 OKR trimestriel | ⭐ 4.8/5 | 4 890 |

---

## Bonnes pratiques

### ✅ Utiliser les modèles efficacement
1. Lisez toujours la description et les instructions avant d'utiliser
2. Commencez par des modèles officiels pour les cas courants
3. Vérifiez la note et le nombre d'utilisations
4. Lisez les commentaires des autres utilisateurs
5. Modifiez toujours le modèle pour l'adapter à votre cas

### ✅ Créer de bons modèles
1. Faites en sorte qu'il soit aussi générique que possible
2. Ajoutez des instructions claires
3. Incluez des exemples
4. Utilisez des placeholders clairs `[COMME_CECI]`
5. Testez-le plusieurs fois avant de publier

---

## Comment sont notés les modèles

La note globale est calculée sur :
- ⭐ Note moyenne des utilisateurs
- 🔄 Nombre d'utilisations
- ✅ Taux de réussite
- 💬 Commentaires positifs
- 🛡️ Statut officiel/verifié

---

## Soumettre un modèle pour vérification

Si vous voulez que votre modèle obtienne le badge ✅ **Vérifié par mAI** :

1. Votre modèle doit avoir au moins 100 utilisations
2. Avoir une note minimum de 4.5/5
3. Avoir une documentation complète
4. Ne pas contenir de contenu protégé
5. Soumettez une demande de vérification

---

## API de la bibliothèque

Pour les développeurs, vous pouvez accéder à la bibliothèque via l'API :

```javascript
// Récupérer les modèles populaires
const response = await fetch('https://api.mai.app/v1/templates?sort=popular&limit=10');

// Utiliser un modèle
const result = await fetch('https://api.mai.app/v1/templates/12345/instantiate', {
  method: 'POST',
  body: JSON.stringify({
    parameters: {
      "nom_entreprise": "Ma Société",
      "secteur": "SaaS"
    }
  })
});
```
