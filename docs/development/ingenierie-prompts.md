# Guide d'Ingénierie de Prompts mAI

## Introduction
L'ingénierie de prompts est l'art de formuler des instructions pour obtenir les meilleurs résultats possibles de l'IA. Ce guide vous apprend les techniques avancées utilisées par les experts mAI.

---

## Les 4 principes fondamentaux

### 1. Soyez spécifique
❌ Mauvais : "Écris un email"  
✅ Bon : "Écris un email professionnel de 3 paragraphes à Jean Dupont pour l'informer du retard de livraison du projet X, en proposant une solution alternative et en restant poli et rassurant."

### 2. Définissez le rôle
"Tu es un développeur senior avec 15 ans d'expérience en React. Tu expliques les concepts simplement, avec des exemples de code."

### 3. Spécifiez le format
"Réponds sous forme de liste à puces, avec un titre par point et une explication de 2 lignes maximum."

### 4. Donnez des contraintes
"Limite ta réponse à 200 mots. N'utilise pas de jargon technique. Cite au moins 2 sources fiables."

---

## Techniques avancées

### Technique 1 : Few-Shot Learning
Donnez des exemples de ce que vous attendez :

```
Exemple 1 :
Question : Quel est le capital de la France ?
Réponse : 🏛️ Paris

Exemple 2 :
Question : Quel est le capital de l'Allemagne ?
Réponse : 🏛️ Berlin

Maintenant réponds :
Question : Quel est le capital du Japon ?
```

### Technique 2 : Chain-of-Thought
Demandez à l'IA de raisonner étape par étape :

```
Résous ce problème étape par étape :
Un magasin vend des pommes à 1.5€ l'unité.
Il y a une réduction de 10% pour plus de 10 pommes.
Combien coûtent 15 pommes ?

Réponds d'abord avec ton raisonnement, puis donne le résultat final.
```

### Technique 3 : Persona Pattern
Définissez une identité complète :

```
Tu es Marie, consultante SEO avec 10 ans d'expérience.
Tu parles comme une vraie personne, pas comme un robot.
Tu es franche et directe, tu ne tournes pas autour du pot.
Tu commences souvent tes réponses par "Écoute..."
Tu déconseilles les raccourcis et les méthodes douteuses.
```

---

## Structure de prompt parfaite pour mAI

```
### RÔLE
[Définissez qui est l'IA et son niveau d'expertise]

### OBJECTIF
[Ce que vous voulez accomplir, très précisément]

### CONTEXTE
[Toutes les informations nécessaires pour comprendre la demande]

### FORMAT DE SORTIE
[Comment la réponse doit être structurée]

### CONTRAINTES
[Les règles à respecter absolument]

### EXEMPLES (optionnel)
[Quelques exemples de ce que vous attendez]
```

---

## Exemples de prompts professionnels

### 1. Rédacteur marketing
```
### RÔLE
Tu es un rédacteur publicitaire spécialisé dans le SaaS B2B.

### OBJECTIF
Écris un titre et un sous-titre pour la page d'accueil de mAI.

### CONTEXTE
mAI est une plateforme IA pour les équipes qui veulent automatiser leur travail.

### FORMAT
3 propositions différentes, chacune avec titre + sous-titre.

### CONTRAINTES
- Titre < 50 caractères
- Sous-titre < 150 caractères
- Pas de jargon
- Mettez en évidence le gain de temps
```

### 2. Analyste de données
```
### RÔLE
Tu es un data analyst senior.

### OBJECTIF
Analyse ces données et donne-moi 3 insights actionnables.

### CONTEXTE
[Tableau de données des ventes par mois]

### FORMAT
Chaque insight avec : numéro, constat, explication, action recommandée.

### CONTRAINTES
- Sois concret, pas de généralités
- Priorise par impact
- Donne des chiffres précis
```

---

## Erreurs à éviter

❌ Demander plusieurs choses dans un seul prompt  
❌ Être trop vague ("Fais quelque chose de sympa")  
❌ Supposer que l'IA connaît votre contexte  
❌ Ne pas vérifier les résultats  
❌ Utiliser des formulations négatives ("Ne fais pas ça")

---

## Bonnes pratiques

1. ✅ Testez vos prompts avec des cas limites
2. ✅ Itérez progressivement, changez un paramètre à la fois
3. ✅ Sauvegardez vos bons prompts dans la bibliothèque
4. ✅ Partagez-les avec votre équipe
5. ✅ Utilisez les variables mAI pour les rendre dynamiques

---

## Ressources utiles

- Bibliothèque de prompts mAI : 500+ prompts prêts à l'emploi
- Testeur de prompts : Comparez les résultats entre modèles
- Historique : Retrouvez tous vos anciens prompts
