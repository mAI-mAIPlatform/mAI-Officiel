import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { customProvider, gateway } from "ai";
import { createOllama } from "ollama-ai-provider";
import { isTestEnvironment } from "../constants";
import { titleModel } from "./models";

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

// Création des instances OpenRouter (Triple Sécurité)
const or1 = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY_1 });
const or2 = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY_2 });
const or3 = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY_3 });

// Instance Ollama (token optionnel pour instance locale)
const ollamaProvider = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL,
  headers: process.env.OLLAMA_API_TOKEN
    ? {
        Authorization: `Bearer ${process.env.OLLAMA_API_TOKEN}`,
      }
    : undefined,
});

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  if (isTestEnvironment) {
    return gateway.languageModel(modelId);
  }

  // --- OPENROUTER FALLBACK ---
  if (modelId.startsWith("openrouter/")) {
    const cleanId = modelId.replace("openrouter/", "");

    const fallbackFn = (() => {
      try {
        const ai = require("ai");
        return ai.fallback || ai.experimental_fallback;
      } catch (_e) {
        return undefined;
      }
    })();

    if (fallbackFn) {
      return fallbackFn([or1(cleanId), or2(cleanId), or3(cleanId)]);
    }

    // fallback missing in this version
    return or1(cleanId);
  }

  // --- OLLAMA ---
  if (modelId.startsWith("ollama/")) {
    return ollamaProvider(modelId.replace("ollama/", ""));
  }

  return gateway.languageModel(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return gateway.languageModel(titleModel.id);
}
