import OpenAI from "openai";
import type { ModelMessage } from "ai";

const FS_API_BASE_URL =
  process.env.FS_API_BASE_URL ?? "https://api.francestudent.org/v1/";
const FS_API_KEY = process.env.FS_API_KEY;

const fsModelMapping: Record<string, string> = {
  "openai/gpt-5.4": "gpt-5.4",
  "openai/gpt-5.4-mini": "gpt-5.4-mini",
  "openai/gpt-5.4-nano": "gpt-5.4-nano",
  "openai/gpt-5.2": "gpt-5.2",
  "openai/gpt-5.1": "gpt-5.1",
  "openai/gpt-5": "gpt-5",
  "openai/gpt-oss-120b": "gpt-oss-120b",
  "azure/deepseek-v3.2": "DeepSeek-V3.2",
  "azure/kimi-k2.5": "Kimi-K2.5",
  "azure/mistral-large-3": "Mistral-Large-3",
};

export const fsTextModels = new Set(Object.keys(fsModelMapping));

// Comet image provider has been intentionally disabled.
export const cometImageModels = new Set<string>();

const fsClient = (() => {
  if (!FS_API_KEY) {
    throw new Error("Missing API key: define FS_API_KEY.");
  }

  return new OpenAI({
    baseURL: FS_API_BASE_URL,
    apiKey: FS_API_KEY,
  });
})();

interface ChatCompletionMessage {
  content?: string | Array<{ text?: string }> | null;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: ChatCompletionMessage }>;
  output_text?: string;
}

function extractTextFromChatCompletion(
  data: ChatCompletionResponse | undefined | null
): string {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join("\n")
      .trim();
  }

  return (data?.output_text ?? "").trim();
}

export async function generateResponse(input: {
  model: string;
  messages: Array<{ role: "user" | "assistant" | "developer"; content: string }>;
  systemInstruction?: string;
}): Promise<{ provider: string; text: string }> {
  const completion = await fsClient.chat.completions.create({
    model: input.model,
    messages: [
      ...(input.systemInstruction
        ? [{ role: "developer" as const, content: input.systemInstruction }]
        : []),
      ...input.messages,
    ],
    store: true,
  });

  const text = extractTextFromChatCompletion(completion);

  if (!text) {
    throw new Error("FranceStudent API returned an empty response");
  }

  return { provider: "francestudent", text };
}

export function isExternalTextModel(modelId: string): boolean {
  return fsTextModels.has(modelId);
}

export async function runExternalTextModel(
  modelId: string,
  modelMessages: ModelMessage[],
  options?: { systemInstruction?: string }
): Promise<{ provider: string; text: string }> {
  const providerModelId = fsModelMapping[modelId];

  if (!providerModelId) {
    throw new Error("Unsupported external text model");
  }

  const messages = modelMessages
    .map((modelMessage) => {
      const role =
        modelMessage.role === "system"
          ? "developer"
          : modelMessage.role === "assistant"
            ? "assistant"
            : "user";
      const content = (() => {
        if (typeof modelMessage.content === "string") {
          return modelMessage.content.trim();
        }
        if (Array.isArray(modelMessage.content)) {
          return modelMessage.content
            .map((part) => {
              if (
                typeof part === "object" &&
                part !== null &&
                "type" in part &&
                part.type === "text" &&
                "text" in part &&
                typeof part.text === "string"
              ) {
                return part.text;
              }
              return "";
            })
            .join("\n")
            .trim();
        }
        return "";
      })();
      if (!content) {
        return null;
      }
      return { role, content };
    })
    .filter(
      (message): message is { role: "user" | "assistant" | "developer"; content: string } =>
        message !== null
    );

  if (messages.length === 0) {
    throw new Error("External model requires at least one text message");
  }

  return generateResponse({
    model: providerModelId,
    messages,
    systemInstruction: options?.systemInstruction?.trim(),
  });
}

export async function runCometImageModel(
  _action: "generate-image" | "edit-image",
  _model: string,
  _prompt: string,
  _image?: string
): Promise<{ provider: string; imageUrl?: string; imageBase64?: string }> {
  throw new Error("Image generation provider is disabled. Only OpenAI FS text models are supported.");
}
