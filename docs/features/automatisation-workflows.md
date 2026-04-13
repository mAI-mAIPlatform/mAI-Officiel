# Automatisation des Workflows mAI

## Introduction
L'automatisation des workflows vous permet de créer des séquences d'actions IA qui s'exécutent automatiquement selon des déclencheurs. Gagnez des heures chaque semaine sur les tâches répétitives.

---

## Concepts fondamentaux

Un workflow mAI est composé de 3 éléments :

1. **Déclencheur** : Quand le workflow doit démarrer
2. **Étapes** : Séquence d'actions à exécuter
3. **Actions finales** : Ce qui se passe à la fin

---

## Étape 1 : Choisir un déclencheur

### Déclencheurs disponibles :

| Type | Exemple d'usage |
|------|-----------------|
| 📅 Horaire | Tous les jours à 9h00 |
| 📧 Email | Quand un email arrive dans la boîte |
| 📁 Fichier | Quand un fichier est uploadé dans un dossier |
| 🔗 Webhook | Appel API externe |
| 📋 Formulaire | Soumission d'un formulaire |
| ⏰ Manuel | Déclenché par un utilisateur |

---

## Étape 2 : Ajouter des étapes

Chaque étape peut être une action IA ou une intégration :

### Actions IA natives :
- Résumer un texte
- Extraire des informations
- Traduire un document
- Générer un rapport
- Classifier du contenu
- Analyser le sentiment
- Générer des questions
- Vérifier la conformité

### Intégrations tierces :
- Slack / Teams
- Google Drive / Docs
- Notion
- Airtable
- Zapier
- Base de données
- API personnalisée

---

## Étape 3 : Créer une branche conditionnelle

Les workflows peuvent prendre des décisions automatiquement :

```
SI sentiment = "Négatif"
   → Créer ticket support
   → Notifier responsable
SINON SI sentiment = "Neutre"
   → Archiver dans dossier
SINON
   → Envoyer réponse automatique
FIN SI
```

> 💡 Vous pouvez ajouter jusqu'à 10 niveaux de conditions.

---

## Étape 4 : Configurer les variables

Utilisez des variables pour rendre votre workflow dynamique :

| Variable | Description |
|----------|-------------|
| `{{date}}` | Date actuelle |
| `{{time}}` | Heure actuelle |
| `{{input}}` | Contenu du déclencheur |
| `{{step1.result}}` | Résultat de l'étape 1 |
| `{{user.email}}` | Email de l'utilisateur |
| `{{file.name}}` | Nom du fichier traité |

---

## Étape 5 : Tester et activer

1. Utilisez le bouton **"Tester"** avec des données d'exemple
2. Vérifiez chaque étape dans le journal d'exécution
3. Corrigez les erreurs éventuelles
4. Activez le workflow
5. Surveillez les premières exécutions

---

## Exemples de workflows prêts à l'emploi

### Workflow 1 : Traitement automatique des CV
```
Déclencheur : Nouveau fichier dans dossier "CV entrants"
Étape 1 : Extraire nom, email, compétences
Étape 2 : Noter le CV sur 10
Étape 3 : SI note ≥ 7 → Ajouter à Airtable + Notifier RH
        SINON → Envoyer refus automatique
```

### Workflow 2 : Rapport quotidien
```
Déclencheur : Tous les jours à 17h30
Étape 1 : Récupérer données analytics
Étape 2 : Générer résumé des performances
Étape 3 : Envoyer rapport sur Slack équipe
```

---

## Bonnes pratiques

1. Commencez par des workflows simples avant de complexifier
2. Testez toujours avec des données réelles
3. Ajoutez des étapes de notification pour surveiller l'exécution
4. Mettez en place des alertes en cas d'échec
5. Documentez chaque workflow pour votre équipe

---

## Limites et quotas

- Maximum 50 workflows par équipe
- Maximum 20 étapes par workflow
- 1000 exécutions par mois (plan gratuit)
- Illimité (plan entreprise)
