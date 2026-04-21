import { createOpenAI } from "@ai-sdk/openai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import { titleModel } from "./models";

const FS_API_BASE_URL =
  process.env.FS_API_BASE_URL ?? "https://api.francestudent.org/v1/";
const FS_API_KEY = process.env.FS_API_KEY;
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1";
const OLLAMA_API_KEY =
  process.env.OLLAMA_API_KEY ?? process.env.OLLAMA_API_TOKEN;
const AI_HORDE_OAI_BASE_URL =
  process.env.AI_HORDE_OAI_BASE_URL ?? "https://oai.aihorde.net/v1";
const AI_HORDE_API_KEY = process.env.AI_HORDE_API_KEY ?? "0000000000";
const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEYS = [
  process.env.OPENROUTER_API_KEY_1,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
].filter((value): value is string => Boolean(value && value.trim()));

const fsModelAliases: Record<string, string> = {
  // Alias de compatibilité inverses pour les environnements qui exposent
  // les agents "gpt-5.4*" au lieu des IDs "gpt-5*".
  "gpt-5": "gpt-5.4",
  "gpt-5-mini": "gpt-5.4-mini",
  "gpt-5-nano": "gpt-5.4-nano",
};

function normalizeModelId(modelId: string): string {
  const slashIndex = modelId.indexOf("/");
  const normalizedModelId =
    slashIndex === -1 ? modelId : modelId.slice(slashIndex + 1);

  return fsModelAliases[normalizedModelId] ?? normalizedModelId;
}

function normalizeBaseUrl(baseURL: string): string {
  return baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
}

let cachedFsProvider: ReturnType<typeof createOpenAI> | null | undefined;
let cachedGatewayProvider: ReturnType<typeof createOpenAI> | null | undefined;
let cachedOllamaProvider: ReturnType<typeof createOpenAI> | null | undefined;
let cachedHordeProvider: ReturnType<typeof createOpenAI> | null | undefined;
let cachedOpenRouterProviders: ReturnType<typeof createOpenAI>[] | undefined;
let openRouterProviderIndex = 0;

function getFsProvider(): ReturnType<typeof createOpenAI> | null {
  if (cachedFsProvider !== undefined) {
    return cachedFsProvider;
  }

  if (isTestEnvironment) {
    cachedFsProvider = null;
    return cachedFsProvider;
  }

  if (!FS_API_KEY) {
    console.error(
      "[FranceStudent] FS_API_KEY manquante: le provider AI SDK est désactivé."
    );
    cachedFsProvider = null;
    return cachedFsProvider;
  }

  cachedFsProvider = createOpenAI({
    apiKey: FS_API_KEY,
    baseURL: normalizeBaseUrl(FS_API_BASE_URL),
  });

  return cachedFsProvider;
}

function getGatewayProvider(): ReturnType<typeof createOpenAI> | null {
  if (cachedGatewayProvider !== undefined) {
    return cachedGatewayProvider;
  }

  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  if (!gatewayKey) {
    cachedGatewayProvider = null;
    return cachedGatewayProvider;
  }

  cachedGatewayProvider = createOpenAI({
    apiKey: gatewayKey,
    baseURL: "https://ai-gateway.vercel.sh/v1",
  });

  return cachedGatewayProvider;
}

function getOllamaProvider(): ReturnType<typeof createOpenAI> | null {
  if (cachedOllamaProvider !== undefined) {
    return cachedOllamaProvider;
  }

  if (isTestEnvironment) {
    cachedOllamaProvider = null;
    return cachedOllamaProvider;
  }

  if (!OLLAMA_API_KEY) {
    cachedOllamaProvider = null;
    return cachedOllamaProvider;
  }

  cachedOllamaProvider = createOpenAI({
    apiKey: OLLAMA_API_KEY,
    baseURL: normalizeBaseUrl(OLLAMA_BASE_URL),
  });

  return cachedOllamaProvider;
}

function getHordeProvider(): ReturnType<typeof createOpenAI> | null {
  if (cachedHordeProvider !== undefined) {
    return cachedHordeProvider;
  }

  if (isTestEnvironment) {
    cachedHordeProvider = null;
    return cachedHordeProvider;
  }

  cachedHordeProvider = createOpenAI({
    apiKey: AI_HORDE_API_KEY,
    baseURL: normalizeBaseUrl(AI_HORDE_OAI_BASE_URL),
  });

  return cachedHordeProvider;
}

function getOpenRouterProviders(): ReturnType<typeof createOpenAI>[] {
  if (cachedOpenRouterProviders !== undefined) {
    return cachedOpenRouterProviders;
  }

  cachedOpenRouterProviders = OPENROUTER_API_KEYS.map((apiKey) =>
    createOpenAI({
      apiKey,
      baseURL: normalizeBaseUrl(OPENROUTER_BASE_URL),
    })
  );
  return cachedOpenRouterProviders;
}

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, titleModel } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": titleModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  if (modelId.startsWith("ollama/")) {
    const ollamaProvider = getOllamaProvider();
    if (!ollamaProvider) {
      throw new Error(
        "Ollama provider non initialisé. Configure OLLAMA_API_KEY (ou OLLAMA_API_TOKEN)."
      );
    }
    return ollamaProvider.chat(modelId.slice("ollama/".length));
  }
  if (modelId.startsWith("horde/")) {
    const hordeProvider = getHordeProvider();
    if (!hordeProvider) {
      throw new Error("AI Horde provider non initialisé.");
    }
    return hordeProvider.chat(modelId.slice("horde/".length));
  }
  if (modelId.startsWith("openrouter/")) {
    const openRouterProviders = getOpenRouterProviders();
    if (openRouterProviders.length === 0) {
      throw new Error(
        "OpenRouter provider non initialisé. Configure OPENROUTER_API_KEY_1/2/3."
      );
    }
    const provider =
      openRouterProviders[openRouterProviderIndex % openRouterProviders.length];
    openRouterProviderIndex += 1;
    return provider.chat(modelId.slice("openrouter/".length));
  }

  const fsProvider = getFsProvider();
  if (fsProvider) {
    return fsProvider.responses(normalizeModelId(modelId));
  }

  const gatewayProvider = getGatewayProvider();
  if (gatewayProvider) {
    return gatewayProvider.chat(modelId);
  }

  throw new Error(
    "No AI provider is initialized. Configure FS_API_KEY or AI_GATEWAY_API_KEY."
  );
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  const fsProvider = getFsProvider();
  if (fsProvider) {
    return fsProvider.responses(normalizeModelId(titleModel.id));
  }

  const gatewayProvider = getGatewayProvider();
  if (gatewayProvider) {
    return gatewayProvider.chat(titleModel.id);
  }

  throw new Error(
    "No AI provider is initialized. Configure FS_API_KEY or AI_GATEWAY_API_KEY."
  );
}
