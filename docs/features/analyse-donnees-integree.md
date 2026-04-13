# Analyse de Données Intégrée mAI

## Introduction
mAI intègre un moteur d'analyse de données puissant qui permet d'analyser des tableaux, CSV, Excel et bases de données directement dans vos canevas, sans outil externe.

---

## Formats supportés

✅ CSV (tous encodages)  
✅ Excel (.xlsx, .xls)  
✅ Google Sheets  
✅ Tableaux Markdown  
✅ JSON  
✅ Bases de données (PostgreSQL, MySQL, SQLite)  
✅ APIs REST retournant des données tabulaires

> 📊 Taille maximum : 1 million de lignes / 100MB par fichier

---

## Étape 1 : Importer vos données

### Méthode 1 : Glisser-déposer
Glissez simplement votre fichier CSV/Excel directement dans un canevas. mAI détecte automatiquement le format et propose de l'analyser.

### Méthode 2 : Commande d'import
1. Tapez `/import-donnees`
2. Sélectionnez votre fichier
3. Configurez les options :
   - Délimiteur (pour CSV)
   - Première ligne comme en-tête
   - Encodage
   - Colonnes à ignorer

---

## Étape 2 : Analyse automatique

Dès l'import, mAI effectue automatiquement une analyse complète :

### Ce qui est analysé :
- 📊 Statistiques descriptives (moyenne, médiane, min, max, écart-type)
- 📈 Détection des tendances et saisonnalités
- 🔍 Identification des valeurs aberrantes
- 🎯 Corrélations entre les variables
- 📊 Répartition par catégorie
- ⚠️ Données manquantes et qualité générale

> ⏱️ Analyse complète en 10-30 secondes selon la taille.

---

## Étape 3 : Poser des questions en langage naturel

Vous pouvez interroger vos données en français simple :

```
"Quel est le chiffre d'affaires par mois ?"
"Quels produits ont la meilleure marge ?"
"Quelle est la corrélation entre le prix et les ventes ?"
"Prédis les ventes pour les 3 prochains mois"
"Identifie les clients qui ne commandent plus depuis 3 mois"
```

### Types de questions supportées :
- Agrégations (somme, moyenne, compte)
- Filtrages et tris
- Comparaisons
- Prédictions et tendances
- Segmentation et clustering
- Détection d'anomalies

---

## Étape 4 : Visualisations automatiques

mAI génère automatiquement les graphiques les plus adaptés à vos questions :

| Type de données | Graphique recommandé |
|-----------------|----------------------|
| Évolution temporelle | Courbe linéaire |
| Comparaison catégories | Barres horizontales |
| Répartition | Camembert / Anneau |
| Corrélation | Nuage de points |
| Distribution | Histogramme |
| Géolocalisation | Carte |

> 💡 Vous pouvez changer le type de graphique en un clic après génération.

---

## Étape 5 : Fonctionnalités avancées

### 🎯 Prédictions
mAI peut faire des prédictions basées sur vos données historiques :
```
"Prédis mon chiffre d'affaires pour décembre 2026"
"Quel est le risque de churn pour ce client ?"
"Quel prix optimal pour ce produit ?"
```

### 🔍 Analyse de causes
```
"Pourquoi les ventes ont baissé en mars ?"
"Quels facteurs influencent le plus la satisfaction client ?"
```

### 📊 Rapports automatiques
Générez un rapport d'analyse complet en une commande :
```
/rapport-analyse titre="Analyse Ventes Q1" format="complet"
```

---

## Étape 6 : Nettoyage et transformation des données

mAI peut nettoyer et transformer vos données automatiquement :

### Actions disponibles :
- Supprimer les doublons
- Remplir les valeurs manquantes
- Normaliser les formats
- Supprimer les valeurs aberrantes
- Créer de nouvelles colonnes calculées
- Fusionner plusieurs jeux de données

### Exemple :
```
"Nettoie ce jeu de données : supprime les lignes où le chiffre d'affaires est vide, convertis la date au format JJ/MM/AAAA, ajoute une colonne marge = CA - coût"
```

---

## Bonnes pratiques

### ✅ Pour une analyse fiable
1. Vérifiez toujours l'aperçu des données après import
2. Commencez par des questions simples avant d'aller plus loin
3. Demandez toujours les sources et les calculs pour les résultats importants
4. Exportez les graphiques en haute résolution pour vos présentations
5. Sauvegardez vos requêtes favorites dans la bibliothèque

### ❌ Erreurs à éviter
1. Ne demandez pas de prédictions sur moins de 30 points de données
2. Ne faites pas confiance aveuglement : vérifiez les résultats
3. Ne mélangez pas des données de périodes différentes sans l'indiquer
4. N'analysez pas des données avec plus de 30% de valeurs manquantes

---

## Exemples d'utilisation

### 🛍️ E-commerce
```
Données : Commandes des 6 derniers mois
Question : "Quels sont les 5 produits qui ont le plus augmenté en vente depuis janvier ?"
Résultat : Tableau trié + graphique d'évolution + explication des facteurs possibles
```

### 📈 RH
```
Données : Fiches salariés
Question : "Quels sont les facteurs qui influencent le plus le taux de turnover ?"
Résultat : Corrélations + segmentation des profils à risque + recommandations
```

### 🏭 Production
```
Données : Capteurs usine
Question : "Détecte les anomalies dans les données de température et prédis la prochaine panne"
Résultat : Liste des anomalies + estimation du risque + alertes
```

---

## Limites techniques

| Plan | Lignes maximum | Nombre de colonnes |
|------|----------------|--------------------|
| Gratuit | 10 000 | 50 |
| Pro | 100 000 | 200 |
| Entreprise | 1 000 000 | Illimité |

> 💡 Pour des jeux de données plus grands, utilisez la connexion directe à votre base de données.
