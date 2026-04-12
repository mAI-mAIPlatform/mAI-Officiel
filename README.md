# mAI – Officiel (Next.js)

Plateforme de chat IA moderne, multi‑agents et multi‑modèles, construite avec Next.js App Router et le Vercel AI SDK.  
Ce dépôt contient l’application officielle **mAI** : interface conversationnelle, gestion d’agents, projets, contrôle parental et intégration de nombreux fournisseurs de modèles.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé sur votre système:
- **Node.js 20+** (recommandé: version LTS)
- **pnpm** (gestionnaire de paquets)
- **PostgreSQL** (version 15+)

---

## 🚀 Démarrage rapide

Suivez ces étapes pour lancer le projet en local:

1.  **Cloner le dépôt**
    ```bash
    git clone https://github.com/<votre-organisation>/mai.git
    cd mai
    ```

2.  **Installer les dépendances**
    ```bash
    pnpm install
    ```

3.  **Configurer les variables d'environnement**
    ```bash
    cp .env.example .env
    ```
    Editez ensuite le fichier `.env` avec vos propres valeurs.

4.  **Lancer les migrations base de données**
    ```bash
    pnpm db:migrate
    ```

5.  **Lancer le serveur de développement**
    ```bash
    pnpm dev
    ```

L'application sera accessible à l'adresse: `http://localhost:3000`

---

## 🔧 Variables d'environnement

La configuration complète des variables d'environnement est détaillée dans le fichier:
👉 [docs/environment.md](docs/environment.md)

---

## 📚 Documentation détaillée

Pour comprendre en profondeur l'architecture et le fonctionnement du projet, veuillez consulter les fichiers de documentation suivants :

- [Architecture Générale](docs/architecture.md)
- [Base de Données & ORM](docs/database.md)
- [Authentification](docs/auth.md)
- [Intégration IA & Modèles](docs/ai-integration.md)
- [Interface Utilisateur (UI)](docs/ui.md)
- [Agents et Projets](docs/agents-et-projets.md)
- [Tests E2E](docs/testing.md)
- [Formatage & Linting](docs/linting.md)
- [Stockage de Fichiers](docs/stockage.md)
- [Sécurité & Accès Restreints](docs/security.md)

---

## ✨ Fonctionnalités principales

- **Chat IA avancé**
  - Historique de conversations persistant
  - Messages enrichis (fichiers, contexte, outils)
  - Recherche globale dans la barre latérale

- **Agents mAIs & Projets**
  - **Agents configurables** (personnalité, objectifs, outils)
  - **Pages Projets** avec comportement d’agent dédié
  - Menus contextuels et actions rapides

- **Contrôle parental & sécurité**
  - Module de **contrôle parental** (v0.7.0)
  - Paramètres de sécurité centralisés
  - Gestion des niveaux de réflexion / profondeur de réponse

- **Expérience utilisateur**
  - Refonte graphique moderne (v0.7.0)
  - Mode **ghost** (discrétion / présence minimale)
  - UI basée sur **shadcn/ui** + **Radix UI** + **Tailwind CSS**

- **Multi‑modèles & passerelles IA**
  - Support natif de **Vercel AI Gateway**
  - Modèles inclus : **Mistral, Moonshot, DeepSeek, OpenAI, xAI**, etc.
  - Support **OpenRouter** et **Ollama**
  - Ajout de modèles **Cerebras** et **Mistral low‑cost**

- **Persistance & stockage**
  - **Neon Serverless Postgres** pour les données (chats, utilisateurs, etc.)
  - **Vercel Blob** pour le stockage de fichiers
  - Authentification via **Auth.js**

---

## 🧱 Stack technique

- **Framework :** Next.js (App Router, RSC, Server Actions)
- **Langage :** TypeScript
- **UI :** Tailwind CSS, shadcn/ui, Radix UI
- **IA :** Vercel AI SDK + Vercel AI Gateway + OpenRouteur + Ollama + Google AI
- **Base de données :** Neon Serverless Postgres (via Drizzle)
- **Stockage fichiers :** Vercel Blob
- **Auth :** Auth.js
- **Linting & Formatage :** Biome (Ultracite)
- **Tests :** Playwright
- **Déploiement :** Vercel
