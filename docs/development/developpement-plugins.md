# Développement de Plugins mAI

## Introduction
L'écosystème de plugins mAI vous permet d'étendre les capacités de la plateforme avec vos propres fonctionnalités. Ce guide explique comment développer, tester et publier un plugin.

---

## Prérequis

Pour développer un plugin mAI, vous avez besoin de :
- Connaissances basiques en JavaScript/TypeScript
- Node.js 18+ installé
- Un compte mAI Pro ou Entreprise
- Accès au portail développeur

> 💡 Le SDK mAI est open source et disponible sur GitHub.

---

## Architecture d'un plugin

Un plugin mAI est composé de 3 parties :

1. 📄 **Manifest** : Fichier de configuration qui décrit le plugin
2. 💻 **Code backend** : Logique métier exécutée sur nos serveurs
3. 🎨 **Interface frontend** (optionnel) : Composants UI pour les canevas

### Cycle de vie d'un plugin :
```
Développement → Test → Soumission → Revue → Publication → Mises à jour
```

---

## Étape 1 : Configuration de l'environnement

1. Installez le CLI mAI :
```bash
npm install -g @mai/sdk-cli
```

2. Connectez votre compte :
```bash
mai login
```

3. Créez un nouveau plugin :
```bash
mai create-plugin mon-premier-plugin
```

4. Structure du projet générée :
```
mon-premier-plugin/
├── manifest.json      # Configuration du plugin
├── src/
│   ├── index.ts       # Code principal
│   └── commands.ts    # Commandes disponibles
├── ui/                # Interface frontend (optionnel)
├── tests/             # Tests automatisés
└── package.json
```

---

## Étape 2 : Le fichier Manifest

Le `manifest.json` définit toutes les métadonnées de votre plugin :

```json
{
  "id": "mon-premier-plugin",
  "name": "Mon Premier Plugin",
  "description": "Un exemple de plugin pour mAI",
  "version": "1.0.0",
  "author": "Votre nom",
  "permissions": [
    "canevas:lire",
    "canevas:ecrire"
  ],
  "commands": [
    {
      "name": "dire-bonjour",
      "description": "Dit bonjour à l'utilisateur",
      "parameters": [
        {
          "name": "nom",
          "type": "string",
          "required": true,
          "description": "Nom de la personne à saluer"
        }
      ]
    }
  ]
}
```

---

## Étape 3 : Écrire la logique du plugin

Le code backend s'écrit en TypeScript. Voici un exemple simple :

```typescript
import { Plugin, CommandContext } from '@mai/sdk';

export default class MonPremierPlugin extends Plugin {
  async onLoad() {
    console.log('Plugin chargé avec succès !');
  }

  async direBonjour(ctx: CommandContext, params: { nom: string }) {
    // Accès aux APIs mAI
    const canevas = await ctx.getCanevas();
    
    // Utiliser l'IA
    const reponseIA = await ctx.ia.generate(`
      Dis bonjour à ${params.nom} de manière originale et drôle.
    `);

    // Ajouter du contenu au canevas
    await canevas.appendText(reponseIA);

    // Retourner le résultat
    return {
      success: true,
      message: `Bonjour ${params.nom} !`
    };
  }
}
```

---

## Étape 4 : APIs disponibles pour les plugins

Votre plugin a accès à toutes les capacités de mAI :

| API | Description |
|-----|-------------|
| `ctx.ia` | Accès aux modèles IA (GPT-4o, Claude, etc.) |
| `ctx.getCanevas()` | Manipuler le canevas courant |
| `ctx.getUser()` | Informations sur l'utilisateur |
| `ctx.storage` | Stockage persistant pour votre plugin |
| `ctx.fetch` | Effectuer des requêtes HTTP externes |
| `ctx.ui` | Afficher des composants dans l'interface |

---

## Étape 5 : Tester votre plugin

### Test en mode développement
```bash
mai dev
```

Cette commande lance votre plugin en mode développement et l'installe temporairement dans votre espace mAI. Vous pouvez le tester directement dans l'interface.

### Écrire des tests automatisés
```typescript
import { testPlugin } from '@mai/sdk/testing';

test('dire-bonjour fonctionne', async () => {
  const plugin = await testPlugin(MonPremierPlugin);
  
  const resultat = await plugin.execute('dire-bonjour', { nom: 'Jean' });
  
  expect(resultat.success).toBe(true);
  expect(resultat.message).toContain('Bonjour Jean');
});
```

Lancez les tests :
```bash
npm test
```

---

## Étape 6 : Publier votre plugin

### 1. Construire le plugin
```bash
mai build
```

### 2. Soumettre pour revue
```bash
mai publish
```

### Processus de revue :
1. Vérification automatique (sécurité, qualité du code)
2. Revue manuelle par l'équipe mAI (2-3 jours ouvrés)
3. Si accepté : Publication dans le catalogue
4. Si refusé : Vous recevez des commentaires détaillés

---

## Types de plugins

### 1. Plugins de commande
Ajoutent de nouvelles commandes accessibles via `/` dans les canevas. Le type le plus courant.

### 2. Plugins d'intégration
Connectent mAI à des services externes. Ex: Slack, GitHub, Salesforce.

### 3. Plugins d'interface
Ajoutent de nouveaux composants UI et des types de blocs dans les canevas.

### 4. Plugins de modèle IA
Ajoutent le support pour de nouveaux modèles IA personnalisés.

---

## Bonnes pratiques

### ✅ Sécurité
1. Ne demandez jamais plus de permissions que nécessaire
2. Ne stockez jamais de données sensibles en clair
3. Validez toutes les entrées utilisateur
4. Utilisez `ctx.fetch` plutôt que `fetch` natif pour les requêtes externes

### ✅ Performance
1. Gardez le code du plugin léger
2. Évitez les opérations longues (>30s)
3. Utilisez le cache quand c'est possible
4. Gérez correctement les erreurs

### ✅ Qualité
1. Écrivez des tests pour toutes les commandes
2. Documentez bien votre plugin
3. Ajoutez des exemples d'utilisation
4. Respectez les guidelines de design mAI

---

## Monétisation

Si vous le souhaitez, vous pouvez rendre votre plugin payant :

- Modèle gratuit : Toujours gratuit pour tout le monde
- Modèle freemium : Fonctionnalités de base gratuites, fonctionnalités avancées payantes
- Modèle payant : Accès complet contre abonnement
- One-time purchase : Paiement unique pour une licence à vie

> 💸 Vous recevez 70% des revenus générés par votre plugin.

---

## Ressources

- 📚 Documentation complète : https://developers.mai.app
- 🧑‍💻 GitHub du SDK : https://github.com/mai-app/sdk
- 💬 Discord développeurs : https://discord.gg/mai-developers
- 📖 Exemples de plugins : https://github.com/mai-app/plugin-exemples
