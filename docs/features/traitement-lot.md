# Traitement en Lot mAI

## Introduction
Le traitement en lot vous permet d'exécuter la même opération sur des centaines ou des milliers d'éléments automatiquement. Idéal pour traiter des jeux de données volumineux.

---

## Cas d'usage typiques

✅ Traiter 1000 CVs automatiquement  
✅ Classifier 5000 emails de support  
✅ Résumer 200 articles de blog  
✅ Analyser les commentaires de 1000 clients  
✅ Traduire 500 documents  
✅ Générer des rapports personnalisés pour chaque client

---

## Étape 1 : Préparer vos données

Le traitement en lot accepte ces formats :

| Format | Description |
|--------|-------------|
| CSV | Une ligne = un élément à traiter |
| Excel | Chaque ligne de la feuille = un élément |
| JSON | Tableau d'objets |
| Dossier de fichiers | Chaque fichier = un élément |
| Base de données | Chaque ligne du résultat = un élément |

> ✅ Taille maximum : 10 000 éléments par lot (Gratuit : 100, Pro : 1000, Entreprise : Illimité)

---

## Étape 2 : Configurer le traitement

1. Allez dans **"Outils" → "Traitement en lot"**
2. Importez votre fichier de données
3. Définissez l'opération à effectuer sur chaque élément :

### Exemple de configuration :
```
Pour chaque ligne du CSV :

Élément : {{nom}}, {{email}}, {{cv}}

Action : Analyser ce CV et attribuer une note de 0 à 10 pour le poste de développeur React.

Format de sortie :
note: [note]
points_forts: [3 points forts]
points_faibles: [3 points faibles]
decision: [A inviter / Refusé]
```

---

## Étape 3 : Configurer les paramètres

| Paramètre | Description | Recommandé |
|-----------|-------------|------------|
| Parallélisme | Nombre d'éléments traités en même temps | 5 |
| Délai entre requêtes | Temps d'attente entre chaque élément | 1s |
| Taux d'erreur acceptable | Arrête si plus de X% d'erreurs | 5% |
| Politique de retry | Nombre de tentatives en cas d'échec | 2 |
| Notification | Être notifié à la fin | Oui |

> ⚠️ Ne mettez pas un parallélisme trop élevé, vous risquez de dépasser les quotas.

---

## Étape 4 : Lancer et surveiller

1. Cliquez sur **"Lancer le traitement"**
2. Vous pouvez fermer la page, le traitement continue sur nos serveurs
3. Surveillez la progression en temps réel :
   - ✅ Terminés
   - ⏳ En cours
   - ❌ En échec
   - ⏱️ Temps restant estimé

> 📧 Vous recevrez un email automatiquement quand le traitement est terminé.

---

## Étape 5 : Récupérer les résultats

Une fois terminé, vous pouvez :

1. 📥 Télécharger les résultats en CSV/Excel/JSON
2. 📊 Voir les statistiques globales
3. ❌ Filtrer les éléments en échec pour les retenter
4. 📋 Générer un rapport de synthèse
5. 🔗 Partager les résultats avec votre équipe

### Format des résultats :
Chaque ligne contient :
- Toutes vos colonnes originales
- Les colonnes générées par l'IA
- Statut de traitement
- Temps de traitement
- Message d'erreur si échec

---

## Gestion des échecs

Il est normal qu'un petit pourcentage d'éléments échouent. Voici comment gérer :

### Types d'erreurs :
- 🕐 Timeout : L'IA a pris trop de temps à répondre
- 🚫 Quota dépassé : Attendez et réessayez plus tard
- ❌ Erreur IA : Le prompt a échoué pour cet élément
- 🌐 Erreur réseau : Problème temporaire

### Comment réessayer :
1. Après la fin du traitement, cliquez sur **"Retenter les échecs"**
2. Vous pouvez ajuster les paramètres pour les éléments qui ont échoué
3. Les résultats réussis ne sont pas réexécutés

---

## Exemples prêts à l'emploi

### 📋 Traitement de CVs
```
Pour chaque CV :
- Note sur 10 pour le poste
- 3 points forts
- 3 points faibles
- Décision finale
```

### 📧 Classification support
```
Pour chaque email :
- Catégorie : Technique / Facturation / Commercial
- Urgence : 1-5
- Sentiment : Positif / Neutre / Négatif
- Proposition de réponse
```

### 📝 Analyse de feedback
```
Pour chaque commentaire client :
- Thème principal
- Note de satisfaction
- Point à améliorer
- Action recommandée
```

---

## Bonnes pratiques

### ✅ Avant de lancer un gros lot
1. **Testez sur un échantillon** : Traitez d'abord 10 éléments pour vérifier que le résultat est conforme
2. **Vérifiez manuellement quelques résultats** : Ne faites pas confiance aveuglement
3. **Estimez le temps total** : 1000 éléments × 5s = ~1h30 de traitement
4. **Prévenez votre équipe** : Le traitement utilise des crédits IA

### ✅ Pendant le traitement
1. Ne lancez pas plusieurs traitements en même temps
2. Surveillez les premières minutes pour détecter les problèmes rapidement
3. Vous pouvez arrêter le traitement à tout moment sans perdre ce qui a déjà été traité

### ✅ Après le traitement
1. Vérifiez toujours un échantillon aléatoire des résultats
2. Nettoyez les erreurs et les cas ambigus
3. Sauvegardez le traitement et les résultats dans vos archives

---

## Limites et quotas

| Plan | Éléments par lot | Parallélisme maximum | Traitements par mois |
|------|------------------|----------------------|----------------------|
| Gratuit | 100 | 2 | 5 |
| Pro | 1000 | 10 | 50 |
| Entreprise | Illimité | 50 | Illimité |

> 💡 Pour des traitements de plus de 10 000 éléments, contactez le support pour un traitement dédié.

---

## API de traitement en lot

Pour automatiser les traitements depuis vos systèmes :

```javascript
// Créer un nouveau traitement en lot
const job = await fetch('https://api.mai.app/v1/batch', {
  method: 'POST',
  body: JSON.stringify({
    name: "Traitement CVs Mars 2026",
    data: items,
    prompt: "Analyser ce CV...",
    parallelism: 5
  })
});

// Vérifier le statut
const status = await fetch(`https://api.mai.app/v1/batch/${job.id}`);

// Récupérer les résultats
const results = await fetch(`https://api.mai.app/v1/batch/${job.id}/results`);
```

---

## Webhooks

Vous pouvez configurer un webhook pour être notifié automatiquement quand le traitement est terminé :

```json
{
  "event": "batch.completed",
  "job_id": "job_123456",
  "status": "completed",
  "total": 1000,
  "success": 950,
  "failed": 50,
  "download_url": "https://api.mai.app/v1/batch/job_123456/download"
}
```
