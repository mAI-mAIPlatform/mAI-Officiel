const fs = require("fs");
let code = fs.readFileSync("components/chat/multimodal-input.tsx", "utf8");

const regex =
  /function PureModelSelectorCompact\([\s\S]*?const ModelSelectorCompact = memo\(PureModelSelectorCompact\);/;
const match = code.match(regex);
if (match) {
  const modelSelectorCode = match[0];
  // Remove it from multimodal-input.tsx
  code = code.replace(regex, "");
  fs.writeFileSync("components/chat/multimodal-input.tsx", code);

  // Create components/chat/model-selector-compact.tsx
  const newFile = `"use client";
import equal from "fast-deep-equal";
import { memo, useState } from "react";
import useSWR from "swr";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
  type ModelCapabilities,
} from "@/lib/ai/models";
import { cn } from "@/lib/utils";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = \`\${name}=\${encodeURIComponent(value)}; path=/; max-age=\${maxAge}\`;
}

function getModelLogoProvider(
  model: Pick<ChatModel, "id" | "name" | "provider">
) {
  const id = model.id.toLowerCase();
  const name = model.name.toLowerCase();

  if (id.includes("deepseek") || name.includes("deepseek")) {
    return "deepseek";
  }
  if (id.includes("openai/") || id.includes("/gpt") || name.includes("gpt")) {
    return "openai";
  }
  if (id.includes("anthropic/") || id.includes("/claude") || name.includes("claude")) {
    return "anthropic";
  }
  if (id.includes("google/") || id.includes("/gemini") || name.includes("gemini")) {
    return "google";
  }
  if (id.includes("mistral/") || id.includes("/mistral") || name.includes("mistral")) {
    return "mistral";
  }
  if (id.includes("x-ai/") || id.includes("/grok") || name.includes("grok")) {
    return "xai";
  }
  if (id.includes("cohere/") || id.includes("/command") || name.includes("command")) {
    return "cohere";
  }
  if (name.includes("llama")) {
    return "meta";
  }
  return "custom";
}

${modelSelectorCode}

export { ModelSelectorCompact };
`;
  fs.writeFileSync("components/chat/model-selector-compact.tsx", newFile);
  console.log("ModelSelectorCompact extracted.");
} else {
  console.log("Not found.");
}
