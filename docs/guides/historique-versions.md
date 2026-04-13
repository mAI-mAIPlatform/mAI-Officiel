# Historique et Gestion des Versions mAI

## Introduction
mAI conserve automatiquement l'historique complet de toutes les modifications de vos canevas. Ce guide vous explique comment naviguer dans l'historique, restaurer d'anciennes versions et collaborer sans risque.

---

## Comment fonctionne l'historique

### Enregistrement automatique
- Sauvegarde automatique toutes les 30 secondes
- Chaque modification par un utilisateur crée une version
- Aucune action manuelle nécessaire
- L'historique est conservé selon votre plan

### Ce qui est enregistré
✅ Toutes les modifications de contenu  
✅ Changements de paramètres  
✅ Ajout/suppression de sections  
✅ Modifications des règles IA  
✅ Commentaires et discussions  
✅ Pièces jointes et fichiers

---

## Étape 1 : Accéder à l'historique

1. Ouvrez le canevas
2. Cliquez sur **"Historique"** dans le menu supérieur
3. La barre latérale droite s'ouvre avec la liste des versions
4. Chaque version affiche :
   - Date et heure exacte
   - Auteur de la modification
   - Résumé des changements
   - Taille de la modification

> 💡 Astuce : Utilisez le raccourci clavier `Ctrl+Shift+H` pour ouvrir l'historique rapidement.

---

## Étape 2 : Comparer les versions

Pour voir ce qui a changé entre deux versions :

1. Cliquez avec le bouton droit sur une version
2. Sélectionnez **"Comparer avec la version actuelle"**
3. Ou sélectionnez deux versions et cliquez sur **"Comparer"**

### Légende de la comparaison :
- 🟢 Vert : Contenu ajouté
- 🔴 Rouge : Contenu supprimé
- 🟡 Jaune : Contenu modifié
- ⚪ Gris : Contenu inchangé

---

## Étape 3 : Restaurer une ancienne version

Si vous avez fait une erreur ou voulez revenir en arrière :

1. Trouvez la version à restaurer dans l'historique
2. Cliquez sur **"Restaurer cette version"**
3. Confirmez l'action
4. ✅ Une nouvelle version est créée avec le contenu de l'ancienne version

> ⚠️ Important : La restauration ne supprime pas l'historique. Vous pouvez toujours revenir à l'état d'avant la restauration.

---

## Étape 4 : Créer des points de sauvegarde

Pour marquer des étapes importantes du projet :

1. Ouvrez l'historique
2. Cliquez sur **"Créer un point de sauvegarde"**
3. Donnez un nom descriptif :
   - "Version 1.0 validée client"
   - "Avant modification importante"
   - "État après réunion du 12 avril"
4. Ajoutez une description optionnelle

> 🔖 Les points de sauvegarde sont épinglés en haut de l'historique et ne sont jamais supprimés automatiquement.

---

## Étape 5 : Gérer les branches

Pour les projets complexes, utilisez le système de branches :

1. Cliquez sur **"Branches"** à côté de l'historique
2. Cliquez sur **"Créer une branche"**
3. Donnez un nom à votre branche : `fonctionnalite-x`, `test-ia`
4. Travaillez sur la branche sans affecter la version principale
5. Quand c'est prêt, fusionnez dans la branche principale

### Workflow recommandé :
```
main (version stable)
└── develop
    ├── fonctionnalite-paiement
    ├── design-nouvelle-interface
    └── correction-bugs
```

---

## Bonnes pratiques

### ✅ Ce qu'il faut faire
1. Créez un point de sauvegarde avant toute modification importante
2. Utilisez des branches pour les expérimentations
3. Donnez des noms clairs aux points de sauvegarde
4. Vérifiez toujours le contenu avant de restaurer
5. Communiquez avec votre équipe avant de restaurer

### ❌ Ce qu'il faut éviter
1. Ne restaurez pas sans prévenir les autres collaborateurs
2. Ne créez pas trop de points de sauvegarde inutiles
3. Ne travaillez pas directement sur la branche main pour les changements importants
4. Ne supprimez pas l'historique sauf cas exceptionnels

---

## Conservation de l'historique

| Plan | Durée de conservation |
|------|------------------------|
| Gratuit | 30 jours |
| Pro | 1 an |
| Entreprise | Illimité |

> 💡 Pour les clients Entreprise, il est possible d'exporter l'historique complet pour archivage externe.

---

## Dépannage

- **"Je ne vois pas l'historique"** : Vérifiez vos permissions (vous avez besoin du droit Éditeur)
- **"La version que je cherche n'est plus là"** : Vérifiez la durée de conservation de votre plan
- **"La restauration a échoué"** : Essayez avec une version un peu plus ancienne
- **"Je ne peux pas créer de branche"** : Cette fonctionnalité est réservée aux plans Pro et supérieur

---

## Raccourcis utiles

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Z` | Annuler la dernière modification |
| `Ctrl+Y` | Rétablir la modification |
| `Ctrl+Shift+H` | Ouvrir l'historique |
| `Ctrl+Shift+S` | Créer un point de sauvegarde |
