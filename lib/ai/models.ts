export const DEFAULT_CHAT_MODEL = "openai/gpt-5.4";

export const titleModel = {
  id: "openai/gpt-5.4",
  name: "GPT-5.4",
  provider: "openai",
  description: "Modèle principal pour la génération de titres",
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

// Catalogue volontairement limité aux modèles connectés via FS_API_KEY.
export const chatModels: ChatModel[] = [
  {
    id: "openai/gpt-5.4",
    name: "GPT-5.4",
    provider: "openai",
    description: "Latest frontier agentic coding model.",
    reasoningEffort: "high",
  },
  {
    id: "openai/gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "openai",
    description: "Smaller frontier agentic coding model.",
    reasoningEffort: "medium",
  },
  {
    id: "openai/gpt-5.4-nano",
    name: "GPT-5.4 Nano",
    provider: "openai",
    description: "Ultra fast lightweight model.",
    reasoningEffort: "minimal",
  },
  {
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    description:
      "Latest frontier model with improvements across knowledge, reasoning and coding.",
    reasoningEffort: "medium",
  },
  {
    id: "openai/gpt-5.1",
    name: "GPT-5.1",
    provider: "openai",
    description: "Broad world knowledge with strong general reasoning.",
    reasoningEffort: "medium",
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    provider: "openai",
    description: "Broad world knowledge with strong general reasoning.",
    reasoningEffort: "medium",
  },
  {
    id: "azure/deepseek-v3.2",
    name: "DeepSeek-V3.2",
    provider: "azure",
    description:
      "Latest frontier model with improvements across knowledge, reasoning and coding.",
    reasoningEffort: "medium",
  },
  {
    id: "azure/kimi-k2.5",
    name: "Kimi-K2.5",
    provider: "azure",
    description:
      "Open-source, multimodal model from Moonshot AI built for agentic workflows.",
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS-120b",
    provider: "openai",
    description: "Open source large model.",
    reasoningEffort: "high",
  },
  {
    id: "azure/mistral-large-3",
    name: "Mistral-Large-3",
    provider: "azure",
    description:
      "Large Mistral model deployed on Azure OpenAI for advanced chat and reasoning tasks.",
    reasoningEffort: "medium",
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

const ENABLE_REMOTE_MODEL_CAPABILITIES =
  process.env.ENABLE_REMOTE_MODEL_CAPABILITIES === "1";

const CAPABILITIES_CACHE_TTL_MS = 1000 * 60 * 10;
let cachedCapabilities: Record<string, ModelCapabilities> | null = null;
let cachedCapabilitiesAt = 0;

function buildLocalCapabilities(): Record<string, ModelCapabilities> {
  return Object.fromEntries(
    chatModels.map((m) => [
      m.id,
      {
        tools: true,
        vision:
          m.id.includes("vision") ||
          m.id.includes("flash") ||
          m.id.includes("4o") ||
          m.id.includes("gemini"),
        reasoning:
          m.id.includes("oss") ||
          m.id.includes("reasoning") ||
          m.id.includes("r1"),
      },
    ])
  );
}

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  const localCapabilities = buildLocalCapabilities();

  // Latence minimale par défaut: on évite des dizaines de requêtes distantes au chargement.
  if (!ENABLE_REMOTE_MODEL_CAPABILITIES) {
    return localCapabilities;
  }

  const now = Date.now();
  if (
    cachedCapabilities &&
    now - cachedCapabilitiesAt < CAPABILITIES_CACHE_TTL_MS
  ) {
    return cachedCapabilities;
  }

  const gatewayModelsCapabilitiesArray = await Promise.all(
    chatModels.map(async (model) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);

      try {
        const res = await fetch(
          `https://ai-gateway.vercel.sh/v1/models/${model.id}/endpoints`,
          { next: { revalidate: 86_400 }, signal: controller.signal }
        );

        if (!res.ok) {
          return [model.id, localCapabilities[model.id]] as const;
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
        return [model.id, localCapabilities[model.id]] as const;
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  cachedCapabilities = {
    ...localCapabilities,
    ...Object.fromEntries(gatewayModelsCapabilitiesArray),
  };
  cachedCapabilitiesAt = now;

  return cachedCapabilities;
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
