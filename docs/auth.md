# Authentification

L'authentification est gérée par **NextAuth.js (Auth.js)** v5.

## Configuration

La logique d'authentification se trouve principalement dans `app/(auth)/auth.ts` et la configuration est divisée dans `auth.config.ts`.

## Fonctionnalités

- **Types d'utilisateurs** : Le système supporte les utilisateurs réguliers et les invités (`guest`).
- **Credentials** : Un fournisseur par identifiants (email/mot de passe) est configuré.
- **Sécurité** : Les mots de passe sont hachés et vérifiés à l'aide de la librairie **bcrypt-ts**.

L'état de session est accessible dans l'ensemble de l'application via les hooks et méthodes serveur fournis par Auth.js.
