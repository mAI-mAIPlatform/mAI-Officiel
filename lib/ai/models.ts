export const DEFAULT_CHAT_MODEL = "moonshotai/kimi-k2-0905";

export const titleModel = {
  id: "mistral/mistral-small",
  name: "Mistral Small",
  provider: "mistral",
  description: "Modèle rapide pour les titres",
  gatewayOrder: ["mistral"],
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

export const chatModels: ChatModel[] = [
  // --- MODELES ORIGINAUX (GATEWAY) ---
  {
    id: "deepseek/deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "deepseek",
    description:
      "Modèle polyvalent, rapide et fiable pour les tâches générales avec outils.",
    gatewayOrder: ["bedrock", "deepinfra"],
  },
  {
    id: "mistral/codestral",
    name: "Mistral Codestral",
    provider: "mistral",
    description:
      "Spécialisé pour le code, le débogage et l'assistance au développement.",
    gatewayOrder: ["mistral"],
  },
  {
    id: "mistral/mistral-small",
    name: "Mistral Small",
    provider: "mistral",
    description:
      "Équilibre entre rapidité, compréhension visuelle et qualité de réponse.",
    gatewayOrder: ["mistral"],
  },
  {
    id: "moonshotai/kimi-k2-0905",
    name: "Kimi K2 0905",
    provider: "moonshotai",
    description:
      "Modèle généraliste efficace pour échanges longs et demandes variées.",
    gatewayOrder: ["baseten", "fireworks"],
  },
  {
    id: "moonshotai/kimi-k2.5",
    name: "Kimi K2.5",
    provider: "moonshotai",
    description:
      "Modèle premium Moonshot AI conçu pour la performance sur cas complexes.",
    gatewayOrder: ["fireworks", "bedrock"],
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT OSS 20B",
    provider: "openai",
    description:
      "Modèle compact orienté raisonnement léger, rapide et économique.",
    reasoningEffort: "low",
    gatewayOrder: ["groq", "bedrock"],
  },
  {
    id: "openai/gpt-oss-120b",
    name: "m-5.8",
    provider: "openai",
    description:
      "Grand modèle open-source pour tâches avancées et raisonnement structuré.",
    reasoningEffort: "low",
    gatewayOrder: ["fireworks", "bedrock"],
  },
  {
    id: "xai/grok-4.1-fast-non-reasoning",
    name: "m-5.8-mini",
    provider: "xai",
    description:
      "Version rapide de Grok pour réponses instantanées en contexte conversationnel.",
    gatewayOrder: ["xai"],
  },

  // --- COMETAPI + GEMINI (TEXTE GLOBAL) ---
  {
    id: "gpt-5.4-nano",
    name: "GPT-5.4 Nano",
    provider: "cometapi",
    description:
      "Option CometAPI très économique pour tâches simples et réponses courtes.",
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "cometapi",
    description:
      "Compromis équilibré entre coût, vitesse et qualité sur la majorité des usages.",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "m-5.7-mini",
    provider: "google",
    description:
      "Version Google optimisée pour un excellent rapport qualité/prix en production.",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description:
      "Variante Flash plus qualitative, toujours rapide et adaptée aux charges élevées.",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "m-5.7-nano",
    provider: "google",
    description:
      "Version très abordable pour automatisations fréquentes et prototypage rapide.",
  },

  // --- CEREBRAS LOW-COST ---
  {
    id: "cerebras/llama3.1-8b",
    name: "Cerebras Llama 3.1 8B",
    provider: "cerebras",
    description:
      "Modèle ultra-rapide à coût réduit pour traitements volumineux et répétitifs.",
  },
  {
    id: "cerebras/qwen-3-32b",
    name: "m-5.7",
    provider: "cerebras",
    description:
      "Bon niveau de raisonnement tout en conservant un coût de fonctionnement maîtrisé.",
  },

  // --- MISTRAL API LOW-COST ---
  {
    id: "mistral-api/ministral-3b-latest",
    name: "Ministral 3B",
    provider: "mistral",
    description:
      "Version Mistral minimaliste, idéale pour scénarios contraints en budget.",
  },
  {
    id: "mistral-api/ministral-8b-latest",
    name: "Ministral 8B",
    provider: "mistral",
    description:
      "Modèle abordable prêt pour la production avec de bonnes performances globales.",
  },

  // --- OPENROUTER GRATUITS & LOW-COST ---
  {
    id: "openrouter/stepfun/step-1-flash:free",
    name: "Step 1 Flash (Free)",
    provider: "openrouter",
    description:
      "Alternative gratuite orientée rapidité pour usage ponctuel et expérimentations.",
  },
  {
    id: "openrouter/liquid/lfm-40b:free",
    name: "LFM 40B Trinity (Free)",
    provider: "openrouter",
    description:
      "Modèle LFM gratuit utile pour tests, itérations rapides et charges légères.",
  },
  {
    id: "openrouter/zhipu/glm-4-9b-chat:free",
    name: "GLM-4 9B (Free)",
    provider: "openrouter",
    description:
      "Modèle conversationnel gratuit de Zhipu pour cas standards et découverte.",
  },
  {
    id: "openrouter/meta-llama/llama-3.3-70b-instruct",
    name: "m-5.8-nano",
    provider: "openrouter",
    description:
      "Bon niveau de performance générale à prix compétitif via OpenRouter.",
  },
  {
    id: "openrouter/nvidia/llama-3.1-nemotron-70b-instruct",
    name: "Nemotron 70B",
    provider: "openrouter",
    description:
      "Variante optimisée NVIDIA pour workloads techniques et robustes.",
  },
  {
    id: "openrouter/google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash (Free)",
    provider: "openrouter",
    description:
      "Version gratuite orientée vision et rapidité pour tâches multimodales simples.",
  },

  // --- OPENROUTER CHEAP PREMIUM ---
  {
    id: "openrouter/anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "openrouter",
    description: "Modèle Claude compact avec bonne cohérence et coût réduit.",
  },
  {
    id: "openrouter/openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openrouter",
    description:
      "Petit modèle polyvalent, performant pour assistants rapides en production.",
  },
  {
    id: "openrouter/deepseek/deepseek-chat",
    name: "DeepSeek V3 (OR)",
    provider: "openrouter",
    description:
      "Excellent compromis qualité/prix pour usages variés via OpenRouter.",
  },

  // --- OLLAMA (LOCAUX) ---
  {
    id: "ollama/llama3.1",
    name: "Llama 3.1 (Ollama)",
    provider: "ollama",
    description:
      "Exécution locale pour confidentialité renforcée et autonomie totale.",
  },
  {
    id: "ollama/gemma2:9b",
    name: "Gemma 2 9B (Ollama)",
    provider: "ollama",
    description:
      "Modèle local équilibré pour usages généralistes sans dépendance cloud.",
  },
  {
    id: "ollama/mistral-nemo",
    name: "Mistral Nemo (Ollama)",
    provider: "ollama",
    description:
      "Modèle local robuste offrant un bon niveau de qualité en environnement privé.",
  },
  {
    id: "ollama/phi3.5",
    name: "Phi 3.5 (Ollama)",
    provider: "ollama",
    description:
      "Petit modèle local efficace pour tâches rapides et ressources limitées.",
  },
  {
    id: "ollama/deepseek-coder-v2",
    name: "DeepSeek Coder V2",
    provider: "ollama",
    description:
      "Spécialisé code en local pour génération, refactorisation et corrections.",
  },
];

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  const customModelsCapabilities = Object.fromEntries(
    chatModels
      .filter(
        (m) =>
          m.provider === "openrouter" ||
          m.provider === "ollama" ||
          m.provider === "cometapi" ||
          m.provider === "google" ||
          m.provider === "cerebras" ||
          m.id.startsWith("mistral-api/")
      )
      .map((m) => [
        m.id,
        {
          tools: !m.id.includes(":free"),
          vision:
            m.id.includes("vision") ||
            m.id.includes("flash") ||
            m.id.includes("4o") ||
            m.id.includes("mistral-small") ||
            m.id.includes("gemini"),
          reasoning: m.id.includes("oss") || m.id.includes("reasoning"),
        },
      ])
  );

  const gatewayModelsCapabilitiesArray = await Promise.all(
    chatModels
      .filter(
        (m) =>
          m.provider !== "openrouter" &&
          m.provider !== "ollama" &&
          m.provider !== "cometapi" &&
          m.provider !== "google" &&
          m.provider !== "cerebras" &&
          !m.id.startsWith("mistral-api/")
      )
      .map(async (model) => {
        try {
          const res = await fetch(
            `https://ai-gateway.vercel.sh/v1/models/${model.id}/endpoints`,
            { next: { revalidate: 86_400 } }
          );
          if (!res.ok) {
            return [
              model.id,
              { tools: false, vision: false, reasoning: false },
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
            { tools: false, vision: false, reasoning: false },
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
