# Debuggage des Réponses IA mAI

## Introduction
Parfois l'IA ne donne pas la réponse que vous attendez. Ce guide vous explique comment comprendre pourquoi et comment corriger le problème.

---

## Les 5 problèmes les plus courants

| Problème | Fréquence | Solution |
|----------|-----------|----------|
| Hallucinations (informations fausses) | 35% | Vérifier les sources, ajouter du contexte |
| Réponses hors sujet | 25% | Améliorer le prompt |
| Incohérence | 20% | Ajouter des instructions claires |
| Format incorrect | 15% | Spécifier précisément le format attendu |
| Répétitions | 5% | Ajuster les paramètres de température |

---

## Étape 1 : Activer le mode debug

Pour voir ce qui se passe vraiment quand l'IA répond :

1. Allez dans **"Paramètres" → "Développeur"**
2. Activez **"Mode debug IA"**
3. Maintenant, à chaque réponse, vous verrez :
   - 📝 Prompt complet envoyé au modèle
   - ⚙️ Paramètres utilisés (température, etc.)
   - 📚 Sources consultées dans la base de connaissances
   - ⏱️ Temps de traitement par étape
   - 📊 Métriques de confiance de l'IA

> 💡 Ce mode est indispensable pour comprendre pourquoi l'IA se comporte d'une certaine manière.

---

## Étape 2 : Analyser les hallucinations

Les hallucinations sont quand l'IA invente des informations fausses mais crédibles.

### Comment les détecter :
1. ✅ Toujours demander les sources : `"Quelles sources as-tu utilisé pour répondre ?"`
2. 🔍 Vérifiez les chiffres et les faits précis
3. ❓ Demandez une justification : `"Explique ton raisonnement étape par étape"`
4. 🧪 Testez avec des questions dont vous connaissez la réponse

### Comment les corriger :
```
❌ Problématique : "Combien coûte le plan Pro ?"
✅ Meilleur : "Combien coûte le plan Pro de mAI ? Réponds seulement si tu es certain à 100%. Si tu ne sais pas, dis 'Je ne sais pas'."
```

---

## Étape 3 : Corriger les réponses hors sujet

Si l'IA répond à côté de la question :

### Vérifiez d'abord :
1. Votre question est-elle claire et non ambigüe ?
2. Y a-t-il trop de contexte qui parasite ?
3. L'IA a-t-elle bien compris le contexte ?

### Technique de correction :
Utilisez la méthode **"Réaffirmation"** :
```
Tu as répondu : [collez la réponse de l'IA]

Ce n'est pas ce que j'ai demandé. Je te repose ma question clairement :

Ma question exacte : [votre question]

Réponds seulement à cette question, rien d'autre.
```

---

## Étape 4 : Ajuster les paramètres du modèle

Vous pouvez ajuster ces paramètres pour changer le comportement de l'IA :

| Paramètre | Effet | Plage | Valeur par défaut |
|-----------|-------|-------|-------------------|
| Température | Créativité vs Prévisibilité | 0-2 | 0.7 |
| Top P | Diversité des réponses | 0-1 | 0.9 |
| Fréquence pénalité | Évite les répétitions | 0-2 | 0.0 |
| Présence pénalité | Encourage les nouveaux sujets | 0-2 | 0.0 |

### Cas d'usage :
- 📝 Rédaction créative : Température 1.0 - 1.5
- 📊 Analyse de données : Température 0.0 - 0.3
- ✍️ Code : Température 0.2 - 0.5
- 🎓 Réponses factuelles : Température 0.0

---

## Étape 5 : Vérifier la base de connaissances

Si l'IA ne trouve pas vos informations :

1. **Vérifiez que le document est bien indexé** : Allez dans Base de connaissances → Voir le statut
2. **Vérifiez la pertinence** : La réponse est-elle bien dans les premiers résultats ?
3. **Testez avec un extrait** : Collez directement l'extrait pertinent dans votre prompt
4. **Augmentez le nombre de sources** : Passez de 5 à 10 sources consultées

### Commande de diagnostic :
```
/diagnostique-connaissance "Quel est notre politique de congés ?"
```

Cette commande vous montre exactement quels documents l'IA a consulté et pourquoi elle n'a pas trouvé l'information.

---

## Étape 6 : Technique du prompt parfait

Si rien ne marche, utilisez cette structure de prompt infaillible :

```
### RÔLE
Tu es [définition précise du rôle]

### RÈGLES ABSOLUES
- Règle 1
- Règle 2
- Règle 3

### CONTEXTE
Tout le contexte nécessaire, rien d'autre

### MA QUESTION
La question la plus précise possible

### FORMAT DE RÉPONSE
Exactement ce que j'attends comme format
```

### Exemple :
```
### RÔLE
Tu es un comptable expert avec 20 ans d'expérience.

### RÈGLES ABSOLUES
- Réponds uniquement en français
- Donne toujours les sources de tes chiffres
- Si tu ne sais pas, dis-le clairement
- Ne donne jamais de conseils juridiques

### CONTEXTE
Chiffre d'affaires 2024 : 1 200 000 €
Charges 2024 : 850 000 €
Taux d'impôt : 25%

### MA QUESTION
Quel est le bénéfice net après impôt ?

### FORMAT DE RÉPONSE
Donne uniquement le chiffre, suivi d'un court calcul.
```

---

## Étape 7 : Journal des échecs

Pour les problèmes récurrents :

1. Ouvrez le journal de debug
2. Copiez l'ID de la requête
3. Ajoutez un commentaire : `"Réponse incorrecte, l'IA a inventé un chiffre"`
4. L'équipe mAI analyse les échecs marqués et améliore le système automatiquement

> 💡 Les clients Entreprise ont accès à un ingénieur prompt dédié pour résoudre leurs problèmes spécifiques.

---

## Bonnes pratiques de debug

1. ✅ Changez un seul paramètre à la fois pour isoler le problème
2. ✅ Testez systématiquement après chaque modification
3. ✅ Sauvegardez les prompts qui fonctionnent bien
4. ✅ Partagez les problèmes avec votre équipe pour éviter de réinventer la roue
5. ❌ Ne vous fâchez pas contre l'IA, c'est généralement votre prompt qui est en cause

---

## Outils de debug disponibles

| Outil | Usage |
|-------|-------|
| 🕵️ Mode debug | Voir ce qui est envoyé au modèle |
| 🧪 Prompt Playground | Tester différents prompts et paramètres |
| 📊 Comparateur de modèles | Comparer la réponse de GPT-4o, Claude, Gemini |
| 🔍 Diagnostic connaissance | Voir ce que l'IA trouve dans votre base |
| 📜 Historique des requêtes | Retrouver toutes vos anciennes requêtes |

---

## Quand contacter le support

Contactez le support si :
- Le problème persiste après avoir essayé toutes les étapes de ce guide
- Vous obtenez systématiquement des réponses incorrectes sur un sujet spécifique
- Vous avez besoin d'aide pour optimiser un prompt important
- Vous soupçonnez un bug dans le système

> 📧 Pour un debug rapide, fournissez toujours l'ID de la requête que vous trouverez dans le mode debug.
