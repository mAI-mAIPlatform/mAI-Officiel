# Architecture générale

Le projet mAI est construit sur **Next.js** en utilisant le nouveau **App Router** (`app/`).

## Structure des répertoires

- `app/(auth)` : Contient les pages relatives à l'authentification (connexion, inscription, callbacks).
- `app/(chat)` : Contient l'application principale de chat, incluant les composants de la sidebar, et l'interface de conversation.
- `app/api` : Contient les routes API côté serveur, comme la gestion des accès restreints et les webhooks.

## Technologies clés

- **Next.js** : Framework React avec rendu côté serveur (SSR) et composants serveurs (RSC).
- **Turbopack** : Utilisé dans l'environnement de développement pour des builds plus rapides (`next dev --turbo`).
- L'application est divisée en Server Components pour la récupération des données (Drizzle) et Client Components (UI interactive, streaming AI).
