# Intégration IA

Le cœur de l'application repose sur le **Vercel AI SDK**.

## Fournisseurs et Modèles

- **Modèles** : La définition des modèles est centralisée dans `lib/ai/models.ts`. On y trouve notamment des modèles pour le chat, et un modèle spécifique pour générer des titres (`mistral/mistral-small`).
- **Fournisseurs** : Configurés dans `lib/ai/providers.ts`. Le projet supporte des passerelles comme **OpenRouter** (pour gérer de multiples modèles avec fallback), **Ollama** (pour les modèles locaux), et utilise **Vercel AI Gateway**.

## Fonctionnalités avancées

- **Streaming** : Les réponses sont diffusées en temps réel (`DataStreamProvider`).
- **Outils (Tools)** : Les agents IA peuvent invoquer des outils spécifiques côté serveur, étendus via une architecture modulaire.
