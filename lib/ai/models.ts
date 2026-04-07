export const DEFAULT_CHAT_MODEL = "openai/gpt-5-mini";

export const titleModel = {
  id: "openai/gpt-5-nano",
  name: "GPT-5 Nano",
  provider: "openai",
  description: "Modèle rapide et économique pour les titres",
  gatewayOrder: ["openai"],
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  gatewayOrder?: string[];
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
};

// Modèles texte sélectionnables via AI Gateway.
// Note: les modèles d'embeddings (voyage-4-lite, text-embedding-3-small)
// sont exposés séparément pour éviter une erreur runtime dans le chat.
export const chatModels: ChatModel[] = [
  // 🟢 Ultra pas cher
  {
    id: "openai/gpt-5-nano",
    name: "GPT-5 Nano",
    provider: "openai",
    description: "Ultra économique pour les tâches rapides à grand volume.",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT OSS 20B",
    provider: "openai",
    description: "Open-source compact, rapide et très abordable.",
    reasoningEffort: "low",
  },
  {
    id: "openai/gpt-oss-safeguard-20b",
    name: "GPT OSS Safeguard 20B",
    provider: "openai",
    description: "Version safeguard orientée sécurité et coût minimal.",
    reasoningEffort: "low",
  },
  {
    id: "kwaipilot/kat-coder-pro-v1",
    name: "KAT Coder Pro v1",
    provider: "kwaipilot",
    description: "Modèle code à très bas coût d'entrée.",
  },
  {
    id: "openrouter/meta-llama/llama-3.2-3b-instruct:free",
    name: "OpenRouter · Llama 3.2 3B (Free)",
    provider: "openrouter",
    description:
      "Gratuit via OpenRouter, idéal pour prototypage ultra low-cost.",
  },
  {
    id: "openrouter/mistralai/mistral-small-3.2-24b-instruct:free",
    name: "OpenRouter · Mistral Small 3.2 (Free)",
    provider: "openrouter",
    description:
      "Option gratuite polyvalente, bonne qualité/coût côté OpenRouter.",
  },
  {
    id: "openrouter/qwen/qwen-2.5-7b-instruct",
    name: "OpenRouter · Qwen 2.5 7B",
    provider: "openrouter",
    description: "Très abordable pour chat généraliste via OpenRouter.",
  },
  {
    id: "ollama/qwen2.5:3b",
    name: "Ollama · Qwen2.5 3B",
    provider: "ollama",
    description: "Modèle local très léger, coût quasi nul hors machine.",
  },
  {
    id: "ollama/llama3.2:3b",
    name: "Ollama · Llama 3.2 3B",
    provider: "ollama",
    description: "Local compact pour réponses rapides sans coût API.",
  },
  {
    id: "ollama/phi3.5:3.8b",
    name: "Ollama · Phi 3.5 3.8B",
    provider: "ollama",
    description:
      "Alternative locale économique pour tâches techniques légères.",
  },
  {
    id: "fireworks/accounts/fireworks/models/llama-v3p1-8b-instruct",
    name: "Fireworks · Llama 3.1 8B Instruct",
    provider: "fireworks-ai",
    description:
      "Modèle Fireworks économique pour assistants et chat à faible coût.",
  },
  {
    id: "fireworks/accounts/fireworks/models/qwen2p5-7b-instruct",
    name: "Fireworks · Qwen 2.5 7B Instruct",
    provider: "fireworks-ai",
    description:
      "Très bon compromis latence/prix pour usages généralistes Fireworks.",
  },
  {
    id: "fireworks/accounts/fireworks/models/deepseek-v3",
    name: "Fireworks · DeepSeek V3",
    provider: "fireworks-ai",
    description:
      "Option à coût maîtrisé pour tâches plus complexes côté Fireworks.",
  },

  // 🟡 Peu cher
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "Flash Lite économique et polyvalent.",
  },
  {
    id: "alibaba/qwen3.5-flash",
    name: "Qwen 3.5 Flash",
    provider: "alibaba",
    description: "Bon compromis coût/performance en usage général.",
  },
  {
    id: "mistral/ministral-3b",
    name: "Ministral 3B",
    provider: "mistral",
    description: "Modèle compact Mistral, rapide et peu coûteux.",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Petit modèle OpenAI fiable pour assistants de production.",
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Version Flash rapide avec bon rendement coût/qualité.",
  },
  {
    id: "xai/grok-4.1-fast-non-reasoning",
    name: "Grok 4.1 Fast (Non-Reasoning)",
    provider: "xai",
    description: "Réponses très rapides en mode non raisonnement.",
  },
  {
    id: "xai/grok-4.1-fast-reasoning",
    name: "Grok 4.1 Fast (Reasoning)",
    provider: "xai",
    description: "Version Grok fast avec raisonnement activé.",
    reasoningEffort: "medium",
  },
  {
    id: "xai/grok-4-fast-non-reasoning",
    name: "Grok 4 Fast (Non-Reasoning)",
    provider: "xai",
    description: "Variante Grok 4 rapide pour latence faible.",
  },
  {
    id: "xai/grok-code-fast-1",
    name: "Grok Code Fast 1",
    provider: "xai",
    description: "Grok optimisé pour génération et correction de code.",
  },
  {
    id: "openai/gpt-5.4-nano",
    name: "GPT-5.4 Nano",
    provider: "openai",
    description: "Très bon coût d'entrée pour automatisations fréquentes.",
  },
  {
    id: "google/gemini-3.1-flash-lite-preview",
    name: "Gemini 3.1 Flash Lite Preview",
    provider: "google",
    description: "Preview lite pour usages flash à coût contenu.",
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    description: "Compromis qualité/prix pour conversation et agents.",
  },
  {
    id: "openai/gpt-5.1-codex-mini",
    name: "GPT-5.1 Codex Mini",
    provider: "openai",
    description: "Version mini spécialisée productivité développeur.",
  },
  {
    id: "minimax/minimax-m2.5",
    name: "MiniMax M2.5",
    provider: "minimax",
    description: "Modèle généraliste abordable avec bonne stabilité.",
  },
  {
    id: "deepseek/deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "deepseek",
    description: "Excellent rapport performances/coût sur tâches variées.",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Flash avancé pour charges plus exigeantes.",
  },
  {
    id: "minimax/minimax-m2.7",
    name: "MiniMax M2.7",
    provider: "minimax",
    description: "Version M2.7 offrant plus de capacité pour coût modéré.",
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT OSS 120B",
    provider: "openai",
    description: "Grand modèle open-source pour cas avancés.",
    reasoningEffort: "medium",
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    description: "Modèle compact robuste pour usage professionnel.",
  },
  {
    id: "moonshotai/kimi-k2.5",
    name: "Kimi K2.5",
    provider: "moonshotai",
    description: "Modèle premium abordable pour tâches complexes.",
  },
];

export const embeddingModels = [
  {
    id: "voyage/voyage-4-lite",
    name: "Voyage 4 Lite",
    provider: "voyage",
    description: "Embedding ultra économique pour recherche sémantique.",
  },
  {
    id: "openai/text-embedding-3-small",
    name: "Text Embedding 3 Small",
    provider: "openai",
    description: "Embedding OpenAI économique et performant.",
  },
] as const;

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  const customModelsCapabilities = Object.fromEntries(
    chatModels.map((m) => [
      m.id,
      {
        tools: true,
        vision:
          m.id.includes("vision") ||
          m.id.includes("flash") ||
          m.id.includes("4o") ||
          m.id.includes("gemini"),
        reasoning: m.id.includes("oss") || m.id.includes("reasoning"),
      },
    ])
  );

  const gatewayModelsCapabilitiesArray = await Promise.all(
    chatModels.map(async (model) => {
      try {
        const res = await fetch(
          `https://ai-gateway.vercel.sh/v1/models/${model.id}/endpoints`,
          { next: { revalidate: 86_400 } }
        );
        if (!res.ok) {
          return [
            model.id,
            customModelsCapabilities[model.id] ?? {
              tools: false,
              vision: false,
              reasoning: false,
            },
          ] as const;
        }

        const json = await res.json();
        const endpoints = json.data?.endpoints ?? [];
        const params = new Set(
          endpoints.flatMap(
            (e: { supported_parameters?: string[] }) =>
              e.supported_parameters ?? []
          )
        );
        const inputModalities = new Set(
          json.data?.architecture?.input_modalities ?? []
        );

        return [
          model.id,
          {
            tools: params.has("tools"),
            vision: inputModalities.has("image"),
            reasoning: params.has("reasoning"),
          },
        ] as const;
      } catch {
        return [
          model.id,
          customModelsCapabilities[model.id] ?? {
            tools: false,
            vision: false,
            reasoning: false,
          },
        ] as const;
      }
    })
  );

  return {
    ...customModelsCapabilities,
    ...Object.fromEntries(gatewayModelsCapabilitiesArray),
  };
}

export const isDemo = process.env.IS_DEMO === "1";

type GatewayModel = {
  id: string;
  name: string;
  type?: string;
  tags?: string[];
};

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

export async function getAllGatewayModels(): Promise<
  GatewayModelWithCapabilities[]
> {
  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/models", {
      next: { revalidate: 86_400 },
    });
    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return (json.data ?? [])
      .filter((m: GatewayModel) => m.type === "language")
      .map((m: GatewayModel) => ({
        id: m.id,
        name: m.name,
        provider: m.id.split("/")[0],
        description: "",
        capabilities: {
          tools: m.tags?.includes("tool-use") ?? false,
          vision: m.tags?.includes("vision") ?? false,
          reasoning: m.tags?.includes("reasoning") ?? false,
        },
      }));
  } catch {
    return [];
  }
}

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
