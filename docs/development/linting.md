# Formatage et Linting

La qualité et la consistance du code sont maintenues à l'aide d'outils modernes.

## Biome (Ultracite)

Plutôt que Prettier et ESLint séparés, le projet utilise **Biome** (via le wrapper `ultracite`).
- **Configuration** : Les règles sont définies dans `biome.jsonc`.
- **Scripts npm** :
  - `pnpm run check` : Vérifie le linting et le formatage.
  - `pnpm run fix` : Applique automatiquement les corrections et le formatage.

Il est recommandé de lancer `pnpm run fix` avant chaque commit.
