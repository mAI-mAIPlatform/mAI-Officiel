# Variables d'environnement

Ce document décrit toutes les variables d'environnement nécessaires au fonctionnement de l'application.

## Configuration initiale

1.  Copiez le fichier `.env.example` vers `.env.local` (développement) ou `.env` (production)
2.  Remplissez les variables obligatoires pour votre environnement
3.  Les variables optionnelles peuvent être laissées vides ou commentées

> 💡 Générez toujours des secrets sécurisés pour la production. Utilisez `openssl rand -base64 32` ou https://generate-secret.vercel.app/32

---

## Base

| Variable | Description | Obligatoire | Valeur par défaut | Comment obtenir |
|----------|-------------|-------------|-------------------|-----------------|
| `AI_GATEWAY_API_KEY` | Clé API pour le Vercel AI Gateway (proxy et observabilité IA) | ✅ Oui | - | https://vercel.com/ai-gateway |

---

## Base de données

| Variable | Description | Obligatoire | Valeur par défaut | Comment obtenir |
|----------|-------------|-------------|-------------------|-----------------|
| `POSTGRES_URL` | URL de connexion PostgreSQL | ✅ Oui | - | https://vercel.com/docs/postgres |
| `REDIS_URL` | URL de connexion Redis (cache et sessions) | ✅ Oui | - | https://vercel.com/docs/redis |

---

## Authentification

| Variable | Description | Obligatoire | Valeur par défaut | Comment obtenir |
|----------|-------------|-------------|-------------------|-----------------|
| `AUTH_SECRET` | Secret utilisé pour signer les tokens d'authentification | ✅ Oui | - | Générer avec `openssl rand -base64 32` |
| `MAI_PLUS` | Code d'activation pour le plan Plus | ⚠️ Production | - | Généré manuellement côté serveur |
| `MAI_PRO` | Code d'activation pour le plan Pro | ⚠️ Production | - | Généré manuellement côté serveur |
| `MAI_MAX` | Code d'activation pour le plan Max | ⚠️ Production | - | Généré manuellement côté serveur |

---

## IA

Tous les fournisseurs IA suivants sont supportés. Au moins un fournisseur doit être configuré.

| Variable | Description | Obligatoire | Valeur par défaut | Comment obtenir |
|----------|-------------|-------------|-------------------|-----------------|
| `CEREBRAS_API_KEY` | Clé API Cerebras | ❌ Optionnel | - | https://cerebras.ai |
| `MISTRAL_API_KEY` | Clé API Mistral AI | ❌ Optionnel | - | https://console.mistral.ai |
| `FS_API_KEY` | Clé API France Student | ❌ Optionnel | - | https://francestudent.org |
| `HF_API_KEY` | Clé API Hugging Face | ❌ Optionnel | - | https://huggingface.co/settings/tokens |
| `GEMINI_API_KEY_1` à `_4` | Clés API Google Gemini (rotation automatique) | ❌ Optionnel | - | https://aistudio.google.com |
| `OPENROUTER_API_KEY_1` à `_3` | Clés API OpenRouter (fallback multi-clés) | ❌ Optionnel | - | https://openrouter.ai |
| `FIREWORKS_API_KEY` | Clé API Fireworks AI | ❌ Optionnel | - | https://fireworks.ai |
| `OLLAMA_API_TOKEN` | Token d'authentification pour instance Ollama | ❌ Optionnel | - | Configuré sur votre instance Ollama |

### Endpoints custom (optionnels)

Ces variables permettent de surcharger les URLs par défaut des fournisseurs:
- `CEREBRAS_API_BASE_URL`
- `MISTRAL_API_BASE_URL`
- `FS_API_BASE_URL`
- `HUGGINGFACE_API_BASE_URL`
- `FIREWORKS_BASE_URL`
- `OLLAMA_BASE_URL`

---

## Stockage

| Variable | Description | Obligatoire | Valeur par défaut | Comment obtenir |
|----------|-------------|-------------|-------------------|-----------------|
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob pour le stockage de fichiers | ✅ Oui | - | https://vercel.com/docs/storage/vercel-blob |

---

## Analytics

Aucune variable spécifique pour le moment.

---

## Développement

Toutes les variables de cette catégorie sont optionnelles et uniquement pour les environnements locaux.

Aucune variable spécifique pour le moment.

---

## Notes importantes

- Ne jamais commiter le fichier `.env` dans le contrôle de version
- Les variables marquées `⚠️ Production` sont obligatoires uniquement en environnement de production
- Pour les déploiements sur Vercel, certaines variables sont automatiquement injectées par la plateforme
- Les multi-clés (`_1`, `_2`, etc.) permettent la rotation automatique et la répartition de charge