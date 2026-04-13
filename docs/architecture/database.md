# Base de données

L'application utilise **PostgreSQL** comme base de données principale, avec **Neon Serverless Postgres**.

## Drizzle ORM

Les interactions avec la base de données sont gérées par **Drizzle ORM**.
- **Schéma** : Le schéma de la base de données est défini dans `lib/db/schema.ts`. Il inclut des tables pour les utilisateurs (`user`), les chats (`chat`), les projets (`project`), les tâches (`task`) et la mémoire persistante (`memoryEntry`).
- **Migrations** : Les scripts de migration se trouvent dans `lib/db/migrate.ts` et `lib/db/migrations/`. La commande pour générer les migrations est `drizzle-kit generate`.

## Modèle relationnel principal

1. Un **User** peut avoir plusieurs **Chats**.
2. Un **Chat** peut être lié à un **Agent** (`agentId`) ou un **Projet** (`projectId`).
3. Chaque **Chat** contient de multiples **Messages**.
4. Un **Project** appartient à un **User** et peut contenir plusieurs **Tasks**.
5. Les entrées de **Memory** sont globales (`projectId` null) ou locales à un projet.
