export const DEFAULT_CHAT_MODEL = "openai/gpt-5.4";

export const titleModel = {
  id: "openai/gpt-5.4",
  name: "GPT-5.4",
  provider: "openai",
  description:
    "Modèle de pointe de dernière génération, spécifiquement optimisé pour la programmation avancée et la gestion de systèmes d'agents autonomes.",
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
  capabilities?: Partial<ModelCapabilities>;
};

// Catalogue volontairement limité aux modèles connectés via FS_API_KEY.
export const chatModels: ChatModel[] = [
  // ── OpenAI ────────────────────────────────────────────────────────────
  {
    id: "openai/gpt-5.4",
    name: "GPT-5.4",
    provider: "openai",
    description:
      "Modèle de pointe de dernière génération, spécifiquement optimisé pour la programmation avancée et la gestion de systèmes d'agents autonomes.",
    reasoningEffort: "high",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "openai/gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "openai",
    description:
      "Déclinaison compacte du modèle de pointe, conçue pour les processus autonomes et le développement logiciel avec une empreinte opérationnelle réduite.",
    reasoningEffort: "medium",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "openai/gpt-5.4-nano",
    name: "GPT-5.4 Nano",
    provider: "openai",
    description:
      "Modèle ultra-léger de nouvelle génération, rigoureusement optimisé pour maximiser la vitesse d'exécution et l'efficacité des ressources informatiques.",
    reasoningEffort: "minimal",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    description:
      "Modèle avancé offrant des performances significativement améliorées dans les domaines de l'acquisition de connaissances, du raisonnement analytique et de la programmation.",
    reasoningEffort: "medium",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "openai/gpt-5.1",
    name: "GPT-5.1",
    provider: "openai",
    description:
      "Modèle doté d'une base de connaissances exhaustive, couplée à de solides capacités de raisonnement cognitif général.",
    reasoningEffort: "medium",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    provider: "openai",
    description:
      "Modèle fondamental disposant d'une vaste base de connaissances et de capacités d'analyse logique robustes.",
    reasoningEffort: "medium",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS-120b",
    provider: "openai",
    description:
      "Modèle open-source de 120 milliards de paramètres développé par OpenAI, conçu exclusivement pour l'exécution de tâches de raisonnement à haute performance.",
    reasoningEffort: "high",
    capabilities: { tools: true, vision: true, reasoning: true },
  },

  // ── Azure (DeepSeek, Kimi, Mistral) ───────────────────────────────────
  {
    id: "azure/deepseek-v3.2",
    name: "DeepSeek-V3.2",
    provider: "azure",
    description:
      "Modèle de dernière génération intégrant des optimisations substantielles en matière de connaissances globales, d'analyse logique et de développement de code.",
    reasoningEffort: "medium",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "azure/kimi-k2.5",
    name: "Kimi-K2.5",
    provider: "azure",
    description:
      "Modèle multimodal open-source développé par Moonshot AI, architecturé spécifiquement pour l'élaboration et la gestion de flux de travail automatisés.",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "azure/mistral-large-3",
    name: "Mistral-Large-3",
    provider: "azure",
    description:
      "Modèle de grande capacité développé par Mistral et déployé sur l'infrastructure Azure OpenAI, destiné aux interactions conversationnelles complexes et aux tâches d'analyse approfondie.",
    reasoningEffort: "medium",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "azure/kimi-k2.6",
    name: "Kimi K2.6",
    provider: "azure",
    description:
      "Nouvelle itération Kimi optimisée pour le raisonnement multi-étapes et les flux conversationnels complexes.",
    capabilities: { tools: true, vision: true, reasoning: true },
  },

  // ── AI Horde (Text) ───────────────────────────────────────────────────
  {
    id: "horde/Cydonia-24B-v4.3",
    name: "Cydonia-24B-v4.3",
    provider: "horde",
    description: "Modèle texte AI Horde orienté génération générale.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/Skyfall-31B-v4.1",
    name: "Skyfall-31B-v4.1",
    provider: "horde",
    description: "Modèle texte AI Horde 31B orienté dialogue.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/Gemma-4-31B-it",
    name: "Gemma-4-31B-it",
    provider: "horde",
    description: "Modèle texte AI Horde Gemma instruction-tuned.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/Behemoth-R1-123B-v2-w4a16",
    name: "Behemoth-R1-123B-v2-w4a16",
    provider: "horde",
    description: "Modèle texte AI Horde très grande capacité.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/Ministral-3-8B-Instruct-2512",
    name: "Ministral-3-8B-Instruct-2512",
    provider: "horde",
    description: "Modèle texte AI Horde compact et rapide.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/Rocinante-XL-16B-v1a-Q4_K_M",
    name: "Rocinante-XL-16B-v1a-Q4_K_M",
    provider: "horde",
    description: "Modèle texte AI Horde orienté performances équilibrées.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/L3-8B-Stheno-v3.2",
    name: "L3-8B-Stheno-v3.2",
    provider: "horde",
    description: "Modèle texte AI Horde 8B à faible latence.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/mini-magnum-12b-v1.1",
    name: "mini-magnum-12b-v1.1",
    provider: "horde",
    description: "Modèle texte AI Horde mid-size orienté chat.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/MN-12B-Mag-Mell-R1.Q5_K_M",
    name: "MN-12B-Mag-Mell-R1.Q5_K_M",
    provider: "horde",
    description: "Modèle texte AI Horde spécialisé rôleplay/raisonnement.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/Artemis-31B-v1b-Q4_K_M",
    name: "Artemis-31B-v1b-Q4_K_M",
    provider: "horde",
    description: "Modèle texte AI Horde 31B.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/pygmalion-2-7b.Q4_K_M",
    name: "pygmalion-2-7b.Q4_K_M",
    provider: "horde",
    description: "Modèle texte AI Horde 7B conversationnel.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/L3-Super-Nova-RP-8B",
    name: "L3-Super-Nova-RP-8B",
    provider: "horde",
    description: "Modèle texte AI Horde RP 8B.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/WizzGPTv8",
    name: "WizzGPTv8",
    provider: "horde",
    description: "Modèle texte AI Horde polyvalent.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/Qwen_Qwen3-0.6B-IQ4_XS",
    name: "Qwen_Qwen3-0.6B-IQ4_XS",
    provider: "horde",
    description: "Modèle texte AI Horde Qwen compact.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/LFM2.5-1.2B-Instruct",
    name: "LFM2.5-1.2B-Instruct",
    provider: "horde",
    description: "Modèle texte AI Horde léger orienté instructions.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/HY-MT1.5-1.8B",
    name: "HY-MT1.5-1.8B",
    provider: "horde",
    description: "Modèle texte AI Horde compact pour requêtes rapides.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "horde/Qwen3-30B-A3B-abliterated-erotic",
    name: "Qwen3-30B-A3B-abliterated-erotic",
    provider: "horde",
    description: "Modèle texte AI Horde Qwen3 30B.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },

  // ── Ollama (Text local) ───────────────────────────────────────────────
  {
    id: "ollama/qwen3:14b",
    name: "Qwen3:14b",
    provider: "ollama",
    description: "Modèle local Ollama Qwen3 14B.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "ollama/llama3.1:8b",
    name: "Llama3.1:8b",
    provider: "ollama",
    description: "Modèle local Ollama Llama 3.1 8B.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "ollama/mixtral:8x7b",
    name: "Mixtral:8x7b",
    provider: "ollama",
    description: "Modèle local Ollama Mixtral 8x7B.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "ollama/deepseek-r1",
    name: "DeepSeek-R1",
    provider: "ollama",
    description: "Modèle local Ollama DeepSeek-R1.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "ollama/gemma2:9b",
    name: "Gemma2:9b",
    provider: "ollama",
    description: "Modèle local Ollama Gemma2 9B.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },

  // ── Anthropic / Claude ────────────────────────────────────────────────
  {
    id: "anthropic/claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "anthropic",
    description:
      "Modèle d'excellence d'Anthropic, accessible via l'API Messages sécurisée par OAuth, dédié à la résolution de requêtes complexes exigeant un niveau d'effort cognitif maximal.",
    reasoningEffort: "high",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "anthropic/claude-opus-4-7",
    name: "Claude Opus 4.7",
    provider: "anthropic",
    description:
      "Version avancée du modèle Opus d'Anthropic, optimisée pour les tâches stratégiques, l'analyse longue et la génération de code complexe.",
    reasoningEffort: "high",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "claude/claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "claude",
    description:
      "Modèle intermédiaire d'Anthropic, accessible via l'API Messages sécurisée par OAuth, offrant un équilibre optimal entre performance de raisonnement et rapidité d'exécution.",
    reasoningEffort: "medium",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "anthropic/claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    description:
      "Version actualisée du modèle intermédiaire d'Anthropic, accessible via l'API Messages sécurisée par OAuth, garantissant des performances équilibrées et efficientes.",
    reasoningEffort: "medium",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  {
    id: "anthropic/claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    description:
      "Modèle compact d'Anthropic, accessible via l'API Messages sécurisée par OAuth, spécifiquement élaboré pour assurer une latence minimale et des temps de réponse ultra-rapides.",
    reasoningEffort: "low",
    capabilities: { tools: true, vision: true, reasoning: true },
  },
  // ── OpenRouter ─────────────────────────────────────────────────────────
  {
    id: "openrouter/qwen/qwen3.6-plus:free",
    name: "Qwen 3.6 Plus",
    provider: "openrouter",
    description: "Qwen 3.6 Plus via OpenRouter.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "openrouter/qwen/qwen3.6-plus-preview:free",
    name: "Qwen 3.6 Plus Preview",
    provider: "openrouter",
    description: "Qwen 3.6 Plus Preview via OpenRouter.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "openrouter/qwen/qwen3-coder:free",
    name: "Qwen 3 Coder",
    provider: "openrouter",
    description: "Qwen 3 Coder via OpenRouter.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "openrouter/qwen/qwen3-next-80b-a3b-instruct:free",
    name: "Qwen 3 Next",
    provider: "openrouter",
    description: "Qwen 3 Next 80B A3B Instruct via OpenRouter.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70b",
    provider: "openrouter",
    description: "Llama 3.3 70B Instruct via OpenRouter.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "openrouter/nvidia/nemotron-3-super-120b:free",
    name: "Nemotron 3 Super 120b",
    provider: "openrouter",
    description: "Nemotron 3 Super 120B via OpenRouter.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "openrouter/mistralai/mistral-large",
    name: "Mistral Large",
    provider: "openrouter",
    description: "Mistral Large via OpenRouter.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "openrouter/anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "openrouter",
    description: "Claude 3 Haiku via OpenRouter.",
    capabilities: { tools: true, vision: false, reasoning: true },
  },
  {
    id: "openrouter/openai/gpt-oss-20b",
    name: "GPT-OSS-20b",
    provider: "openrouter",
    description: "GPT-OSS-20b via OpenRouter.",
    capabilities: { tools: true, vision: false, reasoning: true },
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
        tools: m.capabilities?.tools ?? true,
        vision:
          m.capabilities?.vision ??
          (m.id.includes("vision") ||
            m.id.includes("flash") ||
            m.id.includes("4o") ||
            m.id.includes("gpt-5") ||
            m.id.includes("gemini") ||
            m.id.includes("claude-opus") ||
            m.id.includes("claude-sonnet")),
        reasoning:
          m.capabilities?.reasoning ??
          (m.id.includes("oss") ||
            m.id.includes("reasoning") ||
            m.id.includes("r1") ||
            m.id.includes("gpt-5") ||
            m.id.includes("claude-opus")),
      },
    ])
  );
}

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  const localCapabilities = buildLocalCapabilities();

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
