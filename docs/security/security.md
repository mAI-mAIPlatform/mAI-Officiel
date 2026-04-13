# Sécurité

La sécurité est implémentée à plusieurs niveaux de l'application.

## Authentification
Les mots de passe des utilisateurs réguliers sont hachés avec `bcrypt-ts`.

## Contrôle Parental
Une fonctionnalité de contrôle parental est intégrée pour filtrer les contenus et ajuster les niveaux de réponse.

## Accès Restreints
Certaines zones de l'application (ex: "coder", "news") sont protégées.
Leur accès est géré dans les routes API (`app/api/restricted-access/route.ts`) via une variable d'environnement `RESTRICTED_ACCESS_HASH`, qui compare une empreinte SHA-256 du code d'accès soumis.
