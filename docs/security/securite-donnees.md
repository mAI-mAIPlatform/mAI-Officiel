# Sécurité et Confidentialité des Données mAI

## Introduction
Chez mAI, la sécurité de vos données est notre priorité numéro un. Ce document explique comment nous protégeons vos informations et comment vous pouvez maximiser la sécurité de votre espace.

---

## Principes fondamentaux

mAI est construit sur 3 principes de sécurité :

1. 🔒 **Chiffrement de bout en bout** : Vos données sont chiffrées en transit et au repos
2. 🚫 **Zero-knowledge** : Nous ne pouvons pas lire le contenu de vos canevas privés
3. ✋ **Vous contrôlez tout** : Vous décidez qui accède à quoi et pendant combien de temps

> ✅ Certifié ISO 27001, SOC 2 Type II et GDPR compliant.

---

## Chiffrement des données

### En transit
- Toutes les communications utilisent TLS 1.3
- HSTS activé avec durée de 2 ans
- Cookies sécurisés avec les drapeaux Secure et HttpOnly
- Désactivation des algorithmes de chiffrement faibles

### Au repos
- Chiffrement AES-256 sur tous les serveurs
- Clés de chiffrement uniques par client
- Rotation des clés tous les 90 jours
- Sauvegardes également chiffrées

### Zero-Knowledge
Pour les plans Pro et Entreprise, vous pouvez activer le mode Zero-Knowledge :
- Vos clés de chiffrement ne quittent jamais votre navigateur
- Nous stockons seulement des données chiffrées que nous ne pouvons pas déchiffrer
- Même en cas de compromission de nos serveurs, vos données restent illisibles

---

## Gestion des accès

### Authentification

| Méthode | Disponibilité |
|---------|---------------|
| Email / Mot de passe | Tous les plans |
| Connexion Google/Microsoft | Tous les plans |
| Authentification à deux facteurs (2FA) | Tous les plans |
| Clés de sécurité FIDO2 | Pro et Entreprise |
| SSO SAML | Entreprise uniquement |
| SCIM | Entreprise uniquement |

> 💡 Nous recommandons vivement d'activer la 2FA pour tous les comptes.

### Permissions granulaires

Vous pouvez contrôler précisément ce que chaque utilisateur peut faire :

| Permission | Description |
|------------|-------------|
| `canevas:lire` | Voir le contenu |
| `canevas:commenter` | Ajouter des commentaires |
| `canevas:editer` | Modifier le contenu |
| `canevas:supprimer` | Supprimer définitivement |
| `canevas:partager` | Partager avec d'autres |
| `equipe:gerer` | Gérer les membres de l'équipe |

---

## Contrôle des données

### Vos droits RGPD
Vous avez à tout moment le droit de :
✅ Accéder à toutes vos données  
✅ Exporter toutes vos données dans un format lisible  
✅ Supprimer définitivement toutes vos données  
✅ Corriger des données inexactes  
✅ Vous opposer au traitement  
✅ Retirer votre consentement

> ⏱️ Toutes les demandes sont traitées dans les 72 heures ouvrées.

### Suppression des données

1. **Suppression normale** : Les données sont placées en corbeille pendant 30 jours
2. **Suppression définitive** : Supprime immédiatement et définitivement
3. **Suppression automatique** : Configurez une durée de conservation pour les canevas
4. **Demande d'oubli** : Supprime absolument toute trace de votre compte et de vos données

---

## Sécurité de l'IA

### Protection contre les fuites de données
Nous avons mis en place plusieurs couches de protection :

1. 🚫 Vos données privées **ne sont jamais** utilisées pour entraîner nos modèles IA
2. 🛡️ Filtrage automatique des données sensibles (numéros CB, cartes d'identité, etc.)
3. 🔍 Audit de toutes les requêtes IA
4. 🚧 Sandboxing des agents personnalisés

### Options de configuration IA
Vous pouvez configurer le niveau de sécurité :

| Niveau | Description |
|--------|-------------|
| Standard | Meilleur équilibre performance/sécurité |
| Renforcé | Aucune donnée ne quitte votre environnement |
| Zero-Data | Les requêtes IA ne contiennent jamais vos données |

---

## Audit et traçabilité

### Journal d'audit complet
Toutes les actions sont enregistrées de manière immuable :
- Connexions et déconnexions
- Consultations et modifications
- Partages et changements de permissions
- Exports et téléchargements
- Suppressions

### Conservation des logs
- Gratuit : 30 jours
- Pro : 1 an
- Entreprise : 7 ans

> 📥 Vous pouvez exporter les logs d'audit en CSV à tout moment.

---

## Bonnes pratiques de sécurité

### ✅ Ce que vous devez faire
1. Activer l'authentification à deux facteurs
2. Utiliser un gestionnaire de mots de passe
3. Ne jamais partager votre mot de passe
4. Vérifier régulièrement les sessions actives
5. Configurer des alertes de connexion inhabituelle
6. Supprimer les accès des personnes qui quittent l'équipe

### ❌ Ce que vous ne devez JAMAIS faire
1. Partager un lien public contenant des données sensibles
2. Utiliser le même mot de passe que sur d'autres services
3. Donner les droits Propriétaire à plusieurs personnes
4. Télécharger des fichiers provenant de sources inconnues
5. Désactiver les avertissements de sécurité

---

## Programme de Bug Bounty

Nous opérons un programme de bug bounty récompensant les chercheurs en sécurité qui découvrent des vulnérabilités :

- Récompenses de 100€ à 10 000€ selon la sévérité
- Traitement des rapports dans les 24h
- Reconnaissance publique (si souhaité)
- Pas de poursuites légales pour les recherches responsables

> 👉 Programme disponible sur : https://bugbounty.mai.app

---

## Incidents de sécurité

En cas d'incident de sécurité :
1. Nous vous notifions dans les 72 heures selon la loi
2. Communication complète et transparente sur ce qui s'est passé
3. Mesures correctives mises en place immédiatement
4. Remise à niveau gratuite pour tous les clients affectés

> 📊 Statut de sécurité en temps réel : https://status.mai.app

---

## Pour aller plus loin

- 📄 Politique de confidentialité complète : https://mai.app/confidentialite
- 📄 Documentation sécurité : https://docs.mai.app/securite
- 📄 Certifications : https://mai.app/certifications
- 📧 Contact sécurité : security@mai.app
