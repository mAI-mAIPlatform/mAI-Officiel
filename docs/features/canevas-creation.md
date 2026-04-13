# Guide de création de Canevas mAI

## Introduction
Les Canevas sont des espaces de travail structurés qui permettent d'organiser vos projets IA de manière logique et productive. Ce guide vous explique étape par étape comment créer et configurer un canevas efficace.

---

## Étape 1 : Créer un nouveau Canevas

1. Connectez-vous à votre espace mAI
2. Cliquez sur le bouton **"+ Nouveau Canevas"** en haut à droite
3. Choisissez entre :
   - Canevas vide
   - À partir d'un modèle
   - Importer un canevas existant

> 💡 Conseil : Commencez par un modèle pour gagner du temps sur la structure de base.

---

## Étape 2 : Configurer les paramètres de base

| Paramètre | Description | Valeur recommandée |
|-----------|-------------|--------------------|
| Nom du canevas | Nom clair et descriptif | "Projet X - Analyse IA" |
| Visibilité | Privé / Équipe / Public | Privé par défaut |
| Langue | Langue principale du projet | Auto-détecté |
| IA par défaut | Modèle à utiliser en priorité | GPT-4o / Claude 3 |

---

## Étape 3 : Ajouter des sections

Un canevas est composé de sections modulables :

1. **Section Objectifs** - Définir ce que vous voulez accomplir
2. **Section Données** - Importer vos fichiers et références
3. **Section Travail** - Espace principal pour l'IA
4. **Section Validation** - Points de contrôle et revues
5. **Section Résultats** - Stockage des livrables finaux

---

## Étape 4 : Configurer les règles d'IA

Pour chaque section, vous pouvez définir des comportements spécifiques :

```yaml
règles_ia:
  ton: professionnel
  format: markdown
  longueur: détaillée
  références_obligatoires: true
  interdire_hallucinations: true
```

---

## Étape 5 : Activer les fonctionnalités avancées

✅ Sauvegarde automatique toutes les 30 secondes  
✅ Historique des modifications complet  
✅ Suggestions en temps réel  
✅ Mode collaboration en temps réel  
✅ Verrouillage des sections finales

---

## Bonnes pratiques

1. Utilisez des noms de sections clairs et actions
2. Limitez un canevas à un seul objectif principal
3. Configurez les règles IA avant de commencer à travailler
4. Utilisez les couleurs pour distinguer les types de sections
5. Archivez les canevas terminés plutôt que de les supprimer

---

## Dépannage

- **Le canevas ne se charge pas** : Rafraîchissez la page et vérifiez votre connexion
- **L'IA ne répond pas** : Vérifiez les limites de crédits et les paramètres de section
- **Collaboration ne fonctionne pas** : Assurez-vous que tous les membres ont les droits d'accès
