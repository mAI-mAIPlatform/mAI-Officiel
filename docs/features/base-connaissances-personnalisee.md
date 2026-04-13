# Base de Connaissances Personnalisée mAI

## Introduction
La base de connaissances personnalisée permet à l'IA d'accéder à vos informations internes, documents et procédures pour fournir des réponses précises et contextualisées.

---

## Étape 1 : Préparer vos documents

### Formats acceptés :
✅ PDF, DOCX, PPTX, XLSX  
✅ Texte brut, Markdown, HTML  
✅ Fichiers CSV et JSON  
✅ URLs de sites web  
✅ Transcriptions audio/vidéo

### Bonnes pratiques de préparation :
1. Nommez vos fichiers clairement (`Guide-Utilisateur-v2.3.pdf`)
2. Supprimez les pages inutiles (couvertures, annexes)
3. Vérifiez que le texte est sélectionnable (pas des images)
4. Organisez les documents dans des dossiers logiques

---

## Étape 2 : Importer vos documents

1. Allez dans **"Base de connaissances"**
2. Cliquez sur **"+ Ajouter des sources"**
3. Glissez-déposez vos fichiers ou collez des URLs
4. Attendez la fin de l'analyse (10-60s par document)

> 📊 Statut de traitement : `En file d'attente` → `En traitement` → `Disponible`

---

## Étape 3 : Organiser en collections

Regroupez vos documents par thème pour un accès optimal :

| Collection | Contenu typique |
|------------|-----------------|
| Documentation technique | Guides API, architecture |
| Procédures internes | RH, finance, sécurité |
| Produits | Fiches produits, prix |
| Clients | Cas d'usage, témoignages |
| Formation | Supports de cours, quiz |

> 💡 Astuce : Une collection ne doit pas dépasser 100 documents pour des performances optimales.

---

## Étape 4 : Configurer le traitement

### Options d'indexation :

| Paramètre | Description | Recommandé |
|-----------|-------------|------------|
| Segmentation automatique | Découpe intelligente des documents | Activé |
| Détection des tableaux | Extraction des données tabulaires | Activé |
| Reconnaissance OCR | Traitement des images texte | Désactivé par défaut |
| Traduction automatique | Indexe dans toutes les langues | Désactivé |
| Suppression des doublons | Évite les entrées redondantes | Activé |

---

## Étape 5 : Tester la pertinence

Après l'import, testez systématiquement :

1. Posez des questions spécifiques à vos documents
2. Vérifiez que les sources citées sont correctes
3. Testez des questions ambiguës
4. Ajustez les paramètres de pertinence si nécessaire

### Niveaux de pertinence :
- 🔥 Très pertinent : Document correspond exactement
- ✅ Pertinent : Document lié au sujet
- ⚠️ Peu pertinent : Information partielle
- ❌ Non pertinent : Document incorrect

---

## Étape 6 : Maintenir votre base

### Actions régulières :
✅ **Hebdomadaire** : Ajouter les nouveaux documents  
✅ **Mensuel** : Vérifier les sources obsolètes  
✅ **Trimestriel** : Nettoyer les documents inutilisés  
✅ **Annuel** : Réorganiser les collections

### Métriques à surveiller :
- Taux de précision des réponses
- Documents non trouvés
- Temps de réponse moyen
- Sources les plus consultées

---

## Cas d'usage avancés

### 1. Assistant support client
```
Base de connaissances : FAQ, guides utilisateur, procédures
Résultat : L'IA répond à 80% des questions clients automatiquement
```

### 2. Formateur interne
```
Base de connaissances : Procédures RH, code de conduite, formations
Résultat : Les employés obtiennent des réponses immédiates 24/7
```

### 3. Expert produit
```
Base de connaissances : Documentation technique, fiches produits
Résultat : L'équipe commerciale a toutes les informations en temps réel
```

---

## Dépannage

- **L'IA ne trouve pas l'information** : Vérifiez que le document est bien indexé
- **Réponses incorrectes** : Ajoutez plus de contexte dans les documents
- **Temps de réponse lent** : Réduisez la taille des collections
- **Sources obsolètes** : Archivez les anciennes versions
