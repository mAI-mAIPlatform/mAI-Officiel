# Agents et Projets

L'application n'est pas un simple chat IA, elle intègre un système avancé d'Agents et de Projets.

## Architecture des Données

Dans le schéma Drizzle (`lib/db/schema.ts`), l'entité `Chat` contient :
- `agentId` : Référence à un Agent spécifique.
- `projectId` : Référence à un Projet.

## Agents (mAIs)

Les agents sont des entités configurables avec :
- Une personnalité.
- Des objectifs spécifiques.
- Des outils attitrés.

## Projets

Les pages "Projets" permettent de lier un contexte global à un ensemble de chats, appliquant un comportement d'agent dédié à ce périmètre.
