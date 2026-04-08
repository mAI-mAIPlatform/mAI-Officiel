import type { ChatModel } from "@/lib/ai/models";

type ModelBrandInput = Pick<ChatModel, "id" | "name" | "provider">;

/**
 * Résout la marque réelle d'un modèle pour afficher la bonne icône (ex: Llama => Meta).
 */
export function resolveModelLogoProvider(model: ModelBrandInput): string {
  const id = model.id.toLowerCase();
  const name = model.name.toLowerCase();
  const provider = model.provider.toLowerCase();

  // Priorité explicite pour la série mAI (évite qu'un sous-modèle "grok/deepseek/..." écrase l'icône mAI).
  if (
    provider === "mai" ||
    name === "m-5.8" ||
    name === "m-5.8-mini" ||
    name === "m-5.8-nano" ||
    name === "m-5.7" ||
    name === "m-5.7-mini" ||
    name === "m-5.7-nano"
  ) {
    return "mai-star";
  }

  if (id.includes("llama") || name.includes("llama")) {
    return "meta";
  }
  if (id.includes("deepseek") || name.includes("deepseek")) {
    return "deepseek";
  }
  if (id.includes("qwen") || name.includes("qwen")) {
    return "alibaba";
  }
  if (id.includes("grok") || model.provider === "xai") {
    return "xai";
  }
  if (id.includes("gpt") || id.includes("openai/") || name.includes("gpt")) {
    return "openai";
  }
  if (
    id.includes("gemini") ||
    id.includes("gemma") ||
    model.provider === "google"
  ) {
    return "google";
  }
  if (id.includes("claude") || id.includes("anthropic")) {
    return "anthropic";
  }
  if (id.includes("mistral") || model.provider === "mistral") {
    return "mistral";
  }
  if (id.includes("minimax") || model.provider === "minimax") {
    return "minimax";
  }
  if (id.includes("voyage") || model.provider === "voyage") {
    return "voyage";
  }
  if (id.includes("phi") || name.includes("phi")) {
    return "microsoft";
  }
  if (id.includes("nemotron") || model.provider === "nvidia") {
    return "nvidia";
  }

  // Fournisseurs agrégateurs: on essaye d'afficher la marque du modèle si détectable.
  if (model.provider === "ollama") {
    if (id.includes("deepseek")) {
      return "deepseek";
    }
    if (id.includes("qwen")) {
      return "alibaba";
    }
    return "meta";
  }

  if (model.provider === "openrouter") {
    if (id.includes("deepseek")) {
      return "deepseek";
    }
    if (id.includes("qwen")) {
      return "alibaba";
    }
    if (id.includes("llama")) {
      return "meta";
    }
    if (id.includes("mistral")) {
      return "mistral";
    }
    return "openrouter";
  }

  return model.provider;
}
