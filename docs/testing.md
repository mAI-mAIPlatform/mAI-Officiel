# Tests E2E

Les tests End-to-End sont essentiels pour garantir la fiabilité de l'application.

## Playwright

Le projet utilise **Playwright** pour automatiser les tests navigateurs.
- **Configuration** : Les paramètres (navigateurs, timeouts) sont définis dans `playwright.config.ts`.
- **Scripts** : La commande pour exécuter les tests est définie dans le `package.json` :
  ```bash
  export PLAYWRIGHT=True && pnpm exec playwright test
  ```
Les tests E2E permettent de simuler des parcours utilisateurs complexes, comme l'authentification et les interactions de chat.
