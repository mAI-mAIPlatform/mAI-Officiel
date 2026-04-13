# Export et Partage des Projets mAI

## Introduction
Apprenez à exporter vos projets mAI dans différents formats et à les partager efficacement avec des personnes externes à votre équipe.

---

## Formats d'export disponibles

| Format | Meilleur pour | Contenu exporté |
|--------|---------------|-----------------|
| 📄 PDF | Impression, archivage | Tout le contenu, images, mise en forme |
| 📝 Markdown | Édition ultérieure | Texte, structure, liens |
| 📊 Word | Partage avec clients | Compatible Microsoft Office |
| 📋 HTML | Publication web | Interactif, styles conservés |
| 💾 JSON | Développeurs | Données brutes structurées |
| 📦 mAI Archive | Sauvegarde complète | Tout : contenu, historique, paramètres |

---

## Étape 1 : Exporter un canevas

1. Ouvrez le canevas à exporter
2. Cliquez sur **"..." → "Exporter"**
3. Choisissez le format souhaité
4. Configurez les options :
   - Inclure les commentaires
   - Inclure l'historique des modifications
   - Inclure les pièces jointes
   - Mot de passe de protection (optionnel)
5. Cliquez sur **"Exporter"**
6. Téléchargez le fichier généré

> ⏱️ L'export prend de 5 secondes à 5 minutes selon la taille du canevas.

---

## Étape 2 : Partager avec des personnes externes

### Option 1 : Lien de visualisation
1. Cliquez sur **"Partager"**
2. Activez **"Accès public en lecture seule"**
3. Copiez le lien
4. Optionnel : Définir une date d'expiration
5. Optionnel : Protéger par mot de passe

> ✅ La personne n'a pas besoin de compte mAI pour voir le contenu.

### Option 2 : Invitation comme collaborateur
1. Entrez l'adresse email de la personne
2. Choisissez le niveau de permission
3. Ajoutez un message personnalisé
4. Envoyez l'invitation

> ℹ️ La personne devra créer un compte gratuit mAI pour accéder au canevas.

---

## Étape 3 : Partager des extraits spécifiques

Si vous ne voulez pas partager tout le canevas :

1. Sélectionnez la section ou le texte à partager
2. Cliquez sur le bouton **"Partager la sélection"**
3. Choisissez le format :
   - Image
   - Texte
   - Lien direct vers la section
4. Partagez directement sur Slack, Teams ou par email

> 💡 Astuce : Utilisez cette fonction pour partager des réponses IA spécifiques sans donner accès à tout le projet.

---

## Étape 4 : Publier sur le web

Vous pouvez publier votre canevas comme une page web publique :

1. Ouvrez le canevas
2. Cliquez sur **"Publier sur le web"**
3. Configurez :
   - Thème clair/sombre
   - Afficher la barre de navigation
   - Autoriser les commentaires
   - Indexation par les moteurs de recherche
4. Cliquez sur **"Publier"**
5. Votre canevas est accessible à l'adresse `https://mai.app/p/[identifiant]`

---

## Étape 5 : Export en masse

Pour exporter plusieurs canevas à la fois :

1. Allez dans la liste de vos canevas
2. Sélectionnez les canevas à exporter
3. Cliquez sur **"Exporter la sélection"**
4. Choisissez le format
5. Vous recevrez un email avec un lien de téléchargement d'une archive ZIP

> 📁 Disponible pour les équipes Pro et Entreprise.

---

## Bonnes pratiques

### ✅ Avant de partager
1. Vérifiez qu'il n'y a pas d'informations sensibles
2. Supprimez les brouillons et les sections inutiles
3. Vérifiez que toutes les images et pièces jointes sont bien incluses
4. Testez le lien de partage dans une navigation privée

### ✅ Pour les clients
1. Utilisez le format PDF pour les livrables finaux
2. Ajoutez un filigrane avec votre logo
3. Protégez par mot de passe les documents sensibles
4. Définissez une date d'expiration pour les liens temporaires

---

## Limites et quotas

| Plan | Export par mois | Taille maximum par export |
|------|-----------------|---------------------------|
| Gratuit | 10 | 50MB |
| Pro | Illimité | 500MB |
| Entreprise | Illimité | Illimité |

---

## Dépannage

- **L'export échoue** : Réduisez la taille en supprimant les grosses pièces jointes
- **Le format est cassé** : Essayez un autre format ou contactez le support
- **Le lien ne fonctionne pas** : Vérifiez que le partage est toujours activé
- **Le PDF est mal formaté** : Ajustez la mise en page dans les options d'export

---

## API d'export

Pour les développeurs, vous pouvez automatiser les exports via l'API mAI :

```http
POST /api/v1/canevas/{id}/export
Content-Type: application/json

{
  "format": "pdf",
  "include_comments": true,
  "password": "mon-mot-de-passe-securise"
}
```
