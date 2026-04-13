# Intégration des APIs Externes mAI

## Introduction
mAI peut se connecter à des centaines d'APIs externes pour étendre ses capacités. Ce guide vous explique comment configurer et utiliser ces intégrations.

---

## Étape 1 : Accéder au catalogue d'intégrations

1. Allez dans **"Intégrations"** dans le menu principal
2. Parcourez le catalogue par catégorie :
   - Productivité (Notion, Slack, Google Workspace)
   - Développement (GitHub, GitLab, Jira)
   - CRM (Salesforce, HubSpot)
   - Base de données (PostgreSQL, MongoDB)
   - Autres (Zapier, Make, Stripe)

> ✅ Plus de 500 intégrations disponibles nativement.

---

## Étape 2 : Activer une intégration

### Exemple avec Slack :

1. Recherchez "Slack" dans le catalogue
2. Cliquez sur **"Installer"**
3. Vous êtes redirigé vers le site Slack pour vous authentifier
4. Acceptez les permissions demandées
5. Vous revenez automatiquement sur mAI
6. L'intégration est active !

### Types d'authentification :
- OAuth 2.0 (le plus courant)
- Clé API
- Nom d'utilisateur / Mot de passe
- Token d'accès personnel

---

## Étape 3 : Configurer les actions disponibles

Chaque intégration propose des actions préconfigurées :

### Exemple d'actions Slack :
- ✉️ Envoyer un message
- 📢 Poster dans un canal
- 🔔 Créer un rappel
- 👥 Récupérer la liste des membres
- 📊 Obtenir les statistiques d'un canal

### Exemple d'actions Notion :
- 📄 Créer une page
- 🔍 Rechercher dans la base
- ✏️ Mettre à jour une propriété
- 📥 Récupérer le contenu d'une page
- 🗑️ Archiver une page

---

## Étape 4 : Utiliser les intégrations dans les canevas

Une fois activée, l'intégration est disponible dans tous vos canevas :

1. Ouvrez un canevas
2. Tapez `/` pour ouvrir le menu des commandes
3. Recherchez le nom de l'intégration (ex: `/slack`)
4. Sélectionnez l'action souhaitée
5. Remplissez les paramètres
6. Exécutez !

### Exemple d'utilisation :
```
/slack envoyer-message
Canal : #general
Message : "Bonjour équipe, le rapport est prêt !"
Envoyer maintenant : Oui
```

---

## Étape 5 : Créer des intégrations personnalisées

Si l'outil que vous utilisez n'est pas dans le catalogue, vous pouvez créer une intégration personnalisée :

1. Allez dans **"Intégrations" → "Personnalisée"**
2. Cliquez sur **"+ Nouvelle intégration"**
3. Configurez :
   - Nom et logo
   - URL de base de l'API
   - Méthode d'authentification
   - Headers requis
4. Définissez les endpoints disponibles
5. Testez la connexion

---

## Étape 6 : Utiliser les intégrations dans les workflows

Les intégrations peuvent être utilisées comme étapes dans vos workflows automatisés :

```
Worklow : Traitement ticket support
1. 🔔 Déclencheur : Nouveau ticket dans Zendesk
2. 🤖 IA : Analyse le problème et génère une réponse
3. ✅ Action : Mettre à jour le ticket Zendesk
4. 📧 Action : Envoyer la réponse par email
5. 💬 Action : Notifier sur Slack si problème critique
```

---

## Bonnes pratiques

### ✅ Sécurité
1. Ne partagez jamais vos clés API
2. Utilisez le principe du moindre privilège
3. Révoquez les intégrations inutilisées
4. Activez l'authentification à deux facteurs

### ✅ Performance
1. Évitez les appels API dans les boucles
2. Utilisez la mise en cache quand c'est possible
3. Surveillez les quotas des APIs externes
4. Mettez en place des timeouts appropriés

---

## Dépannage

### Problèmes courants :

1. **"Échec de l'authentification"**
   → Vérifiez vos identifiants
   → Régénérez le token d'accès
   → Vérifiez que les permissions sont correctes

2. **"L'action ne fonctionne pas"**
   → Vérifiez les paramètres obligatoires
   → Consultez les logs d'exécution
   → Testez l'API directement avec un outil comme Postman

3. **"Trop de requêtes"**
   → Implémentez un mécanisme de retry
   → Ajoutez des délais entre les appels
   → Vérifiez les quotas de l'API externe

---

## Limites

- Maximum 50 intégrations actives par équipe
- Temps maximum d'exécution d'une action : 30 secondes
- Taille maximum de la réponse : 10MB
- Les APIs nécessitant une interaction utilisateur ne sont pas supportées
