import { customProvider } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { isTestEnvironment } from "../constants";
import { titleModel } from "./models";

const FS_API_BASE_URL =
  process.env.FS_API_BASE_URL ?? "https://api.francestudent.org/v1/";
const FS_API_KEY = process.env.FS_API_KEY;

function normalizeModelId(modelId: string): string {
  if (modelId.startsWith("openai/")) {
    return modelId.replace("openai/", "");
  }
  return modelId;
}

const fsProvider = (() => {
  if (isTestEnvironment) {
    return null;
  }

  if (!FS_API_KEY) {
    throw new Error("Missing API key: define FS_API_KEY.");
  }

  return createOpenAI({
    apiKey: FS_API_KEY,
    baseURL: FS_API_BASE_URL,
  });
})();

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

  if (!fsProvider) {
    throw new Error("FranceStudent provider is not initialized");
  }

  return fsProvider.chat(normalizeModelId(modelId));
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  if (!fsProvider) {
    throw new Error("FranceStudent provider is not initialized");
  }

  return fsProvider.chat(normalizeModelId(titleModel.id));
}
