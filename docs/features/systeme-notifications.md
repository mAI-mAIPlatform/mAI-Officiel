# Système de Notifications et Alertes mAI

## Introduction
Le système de notifications vous permet de rester informé de ce qui se passe dans mAI sans avoir à vérifier constamment. Configurez les alertes selon vos préférences.

---

## Types de notifications

| Catégorie | Description |
|-----------|-------------|
| 📌 Mention | Quelqu'un vous a taggé dans un commentaire |
| 💬 Commentaire | Nouveau commentaire sur un canevas que vous suivez |
| ✅ Invitation | Invitation à rejoindre une équipe ou un canevas |
| 📣 Partage | Quelqu'un vous a partagé un canevas |
| ⚠️ Modification | Modification importante sur un canevas suivi |
| 🔔 Rappel | Rappel programmé par vous ou l'IA |
| 📊 Workflow | Un workflow automatique s'est terminé |
| 🚨 Alerte | Événement important nécessitant votre attention |

---

## Étape 1 : Configurer vos canaux de notification

Vous pouvez recevoir les notifications par plusieurs canaux :

1. 🔔 **Dans l'application** (défaut)
2. 📧 **Email**
3. 💬 **Slack** / **Microsoft Teams**
4. 📱 **Application mobile** (push)
5. 🔗 **Webhook** (pour les développeurs)

### Comment configurer :
1. Allez dans **"Paramètres" → "Notifications"**
2. Pour chaque type de notification, choisissez les canaux que vous voulez
3. Enregistrez vos préférences

---

## Étape 2 : Personnaliser par type

Configurez précisément ce que vous voulez recevoir :

| Type | Recommandé pour la plupart |
|------|-----------------------------|
| Mention | Tous les canaux |
| Commentaire | Application + Email |
| Invitation | Tous les canaux |
| Partage | Application + Email |
| Modification | Seulement application |
| Rappel | Tous les canaux |
| Workflow | Seulement si échec |
| Alerte | Tous les canaux |

> 💡 Astuce : Désactivez les notifications par email pour les modifications, sinon vous allez recevoir beaucoup de mails.

---

## Étape 3 : Heures de tranquillité

Pour éviter d'être dérangé hors des heures de travail :

1. Activez **"Heures de tranquillité"**
2. Définissez vos horaires :
   - Début : 19h00
   - Fin : 07h00
3. Optionnel : Désactivez complètement le week-end
4. Choisissez ce qui arrive pendant ces heures :
   - Aucune notification du tout
   - Seulement les alertes urgentes
   - Toutes les notifications mais sans push/email

> ✅ Les heures de tranquillité sont synchronisées sur tous vos appareils.

---

## Étape 4 : Notifications par canevas

Vous pouvez configurer des préférences différentes pour chaque canevas :

1. Ouvrez le canevas
2. Cliquez sur **"🔔 Suivi"** en haut à droite
3. Choisissez votre niveau de suivi :

| Niveau | Description |
|--------|-------------|
| 🔕 Ignorer | Aucune notification |
| 🟢 Mentions seulement | Seulement si quelqu'un vous taggue |
| 🟡 Commentaires | Tous les commentaires |
| 🔴 Toutes les modifications | Toute modification, ajout, suppression |

---

## Étape 5 : Alertes personnalisées

Vous pouvez créer des alertes personnalisées qui se déclenchent automatiquement selon des conditions.

### Exemples d'alertes :

```
🔔 Alerte : Chiffre d'affaires bas
Condition : Si le CA quotidien < 10 000€
Action : M'envoyer une notification urgent
```

```
🔔 Alerte : Négatif client
Condition : Si un commentaire client a un sentiment négatif
Action : Notifier le responsable client
```

```
🔔 Alerte : Erreur workflow
Condition : Si un workflow échoue plus de 2 fois
Action : Envoyer un SMS au développeur
```

---

## Étape 6 : Gérer l'historique

Consultez toutes vos notifications passées :

1. Cliquez sur l'icône 🔔 en haut à droite
2. Vous voyez les 50 dernières notifications
3. Filtrez par type : Toutes / Non lues / Mention / Erreur
4. Actions possibles :
   - Marquer comme lu/non lu
   - Marquer tout comme lu
   - Supprimer
   - Configurer ce type de notification

> 📜 Historique conservé pendant 90 jours.

---

## Étape 7 : Notifications d'équipe

Pour les administrateurs, vous pouvez configurer les notifications par défaut pour toute l'équipe :

1. Allez dans **"Équipe" → "Paramètres" → "Notifications"**
2. Définissez les préférences par défaut
3. Forcez certaines notifications si nécessaire :
   - ✅ Tous les membres doivent recevoir les alertes de sécurité
   - ✅ Tous les administrateurs reçoivent les factures
4. Les membres peuvent toujours modifier leurs préférences personnelles sauf pour les notifications forcées.

---

## Bonnes pratiques

### ✅ Pour éviter le bruit
1. Désactivez les notifications pour les canevas qui ne vous concernent pas
2. Utilisez les heures de tranquillité
3. Ne recevez pas les notifications de modification par email
4. Configurez Slack seulement pour les mentions et les alertes urgentes

### ❌ Erreurs à éviter
1. Activer tous les canaux pour tous les types de notification
2. Ne pas configurer les heures de tranquillité
3. Suivre tous les canevas en mode "Toutes les modifications"
4. Ne jamais nettoyer votre historique de notifications

---

## Intégration Slack/Teams

### Comment connecter Slack :
1. Allez dans **"Paramètres" → "Intégrations" → Slack**
2. Cliquez sur **"Connecter"**
3. Autorisez mAI dans votre espace Slack
4. Configurez quelles notifications vous voulez recevoir
5. Choisissez le canal où recevoir les notifications d'équipe

### Commandes Slack disponibles :
- `/mai notifications` - Voir vos notifications récentes
- `/mai settings` - Modifier vos préférences
- `/mai pause 1h` - Mettre les notifications en pause pendant 1 heure

---

## API et Webhooks

Pour les développeurs, vous pouvez recevoir toutes les notifications via webhook :

```javascript
// Exemple de payload de notification
{
  "id": "notif_123456",
  "type": "mention",
  "title": "Jean Dupont vous a mentionné",
  "message": "Regarde ce que j'ai ajouté",
  "link": "https://mai.app/canevas/123#section-45",
  "created_at": "2026-04-12T15:30:00Z",
  "read": false
}
```

Vous pouvez aussi créer des notifications programmatiquement via l'API :

```javascript
await fetch('https://api.mai.app/v1/notifications', {
  method: 'POST',
  body: JSON.stringify({
    user_id: "user_789",
    title: "Rapport prêt",
    message: "Votre rapport mensuel est disponible",
    link: "https://mai.app/rapports/avril-2026"
  })
});
```

---

## Dépannage

- **Je ne reçois pas de notifications** : Vérifiez que vous n'avez pas activé le mode Ne pas déranger
- **Trop de notifications** : Ajustez vos préférences et utilisez les heures de tranquillité
- **Notifications en double** : Déconnectez et reconnectez l'intégration Slack/Teams
- **Notification reçue mais pas de son** : Vérifiez les paramètres de notification de votre navigateur/OS
