import type { ModelMessage } from "ai";
import OpenAI from "openai";

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

const fsModelMapping: Record<string, string> = {
  "openai/gpt-5.4": "gpt-5.4",
  "openai/gpt-5.4-mini": "gpt-5.4-mini",
  "openai/gpt-5.4-nano": "gpt-5.4-nano",
  "openai/gpt-5.2": "gpt-5.2",
  "openai/gpt-5.1": "gpt-5.1",
  "openai/gpt-5": "gpt-5.4",
  "openai/gpt-oss-120b": "gpt-oss-120b",
  "azure/deepseek-v3.2": "DeepSeek-V3.2",
  "azure/kimi-k2.5": "Kimi-K2.5",
  "azure/kimi-k2.6": "Kimi-K2.6",
  "azure/mistral-large-3": "Mistral-Large-3",
  // Anthropic/Claude (à aligner avec les IDs exposés par FranceStudent).
  "anthropic/claude-opus-4-6": "claude-opus-4-20250601",
  "anthropic/claude-opus-4-7": "claude-opus-4-20250714",
  "claude/claude-sonnet-4-20250514": "claude-sonnet-4-20250514",
  "anthropic/claude-sonnet-4-6": "claude-sonnet-4-20250601",
  "anthropic/claude-haiku-4-5": "claude-haiku-4-5-20250401",
};

const ollamaModelMapping: Record<string, string> = {
  "ollama/qwen3:14b": "qwen3:14b",
  "ollama/llama3.1:8b": "llama3.1:8b",
  "ollama/mixtral:8x7b": "mixtral:8x7b",
  "ollama/deepseek-r1": "deepseek-r1",
  "ollama/gemma2:9b": "gemma2:9b",
};

const hordeModelMapping: Record<string, string> = {
  "horde/Cydonia-24B-v4.3": "Cydonia-24B-v4.3",
  "horde/Skyfall-31B-v4.1": "Skyfall-31B-v4.1",
  "horde/Gemma-4-31B-it": "Gemma-4-31B-it",
  "horde/Behemoth-R1-123B-v2-w4a16": "Behemoth-R1-123B-v2-w4a16",
  "horde/Ministral-3-8B-Instruct-2512": "Ministral-3-8B-Instruct-2512",
  "horde/Rocinante-XL-16B-v1a-Q4_K_M": "Rocinante-XL-16B-v1a-Q4_K_M",
  "horde/L3-8B-Stheno-v3.2": "L3-8B-Stheno-v3.2",
  "horde/mini-magnum-12b-v1.1": "mini-magnum-12b-v1.1",
  "horde/MN-12B-Mag-Mell-R1.Q5_K_M": "MN-12B-Mag-Mell-R1.Q5_K_M",
  "horde/Artemis-31B-v1b-Q4_K_M": "Artemis-31B-v1b-Q4_K_M",
  "horde/pygmalion-2-7b.Q4_K_M": "pygmalion-2-7b.Q4_K_M",
  "horde/L3-Super-Nova-RP-8B": "L3-Super-Nova-RP-8B",
  "horde/WizzGPTv8": "WizzGPTv8",
  "horde/Qwen_Qwen3-0.6B-IQ4_XS": "Qwen_Qwen3-0.6B-IQ4_XS",
  "horde/LFM2.5-1.2B-Instruct": "LFM2.5-1.2B-Instruct",
  "horde/HY-MT1.5-1.8B": "HY-MT1.5-1.8B",
  "horde/Qwen3-30B-A3B-abliterated-erotic":
    "Qwen3-30B-A3B-abliterated-erotic",
};

const openRouterModelMapping: Record<string, string> = {
  "openrouter/qwen/qwen3.6-plus:free": "qwen/qwen3.6-plus:free",
  "openrouter/qwen/qwen3.6-plus-preview:free":
    "qwen/qwen3.6-plus-preview:free",
  "openrouter/qwen/qwen3-coder:free": "qwen/qwen3-coder:free",
  "openrouter/qwen/qwen3-next-80b-a3b-instruct:free":
    "qwen/qwen3-next-80b-a3b-instruct:free",
  "openrouter/meta-llama/llama-3.3-70b-instruct:free":
    "meta-llama/llama-3.3-70b-instruct:free",
  "openrouter/nvidia/nemotron-3-super-120b:free":
    "nvidia/nemotron-3-super-120b:free",
  "openrouter/mistralai/mistral-large": "mistralai/mistral-large",
  "openrouter/anthropic/claude-3-haiku": "anthropic/claude-3-haiku",
  "openrouter/openai/gpt-oss-20b": "openai/gpt-oss-20b",
};

export const fsTextModels = new Set([
  ...Object.keys(fsModelMapping),
  ...Object.keys(ollamaModelMapping),
  ...Object.keys(hordeModelMapping),
  ...Object.keys(openRouterModelMapping),
]);

// Comet image provider has been intentionally disabled.
export const cometImageModels = new Set<string>();

let cachedFsClient: OpenAI | null | undefined;
let cachedOllamaClient: OpenAI | null | undefined;
let cachedHordeClient: OpenAI | null | undefined;
let cachedOpenRouterClients: OpenAI[] | undefined;

function normalizeBaseUrl(baseURL: string): string {
  return baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
}

function getFsClient(): OpenAI | null {
  if (cachedFsClient !== undefined) {
    return cachedFsClient;
  }

  if (!FS_API_KEY) {
    console.error(
      "[FranceStudent] FS_API_KEY manquante: le provider textuel est désactivé."
    );
    cachedFsClient = null;
    return cachedFsClient;
  }

  cachedFsClient = new OpenAI({
    baseURL: normalizeBaseUrl(FS_API_BASE_URL),
    apiKey: FS_API_KEY,
  });

  return cachedFsClient;
}

function getOllamaClient(): OpenAI | null {
  if (cachedOllamaClient !== undefined) {
    return cachedOllamaClient;
  }

  if (!OLLAMA_API_KEY) {
    cachedOllamaClient = null;
    return cachedOllamaClient;
  }

  cachedOllamaClient = new OpenAI({
    baseURL: normalizeBaseUrl(OLLAMA_BASE_URL),
    apiKey: OLLAMA_API_KEY,
  });

  return cachedOllamaClient;
}

function getHordeClient(): OpenAI {
  if (cachedHordeClient !== undefined && cachedHordeClient) {
    return cachedHordeClient;
  }

  cachedHordeClient = new OpenAI({
    baseURL: normalizeBaseUrl(AI_HORDE_OAI_BASE_URL),
    apiKey: AI_HORDE_API_KEY,
  });

  return cachedHordeClient;
}

function getOpenRouterClients(): OpenAI[] {
  if (cachedOpenRouterClients !== undefined) {
    return cachedOpenRouterClients;
  }

  cachedOpenRouterClients = OPENROUTER_API_KEYS.map(
    (apiKey) =>
      new OpenAI({
        baseURL: normalizeBaseUrl(OPENROUTER_BASE_URL),
        apiKey,
      })
  );
  return cachedOpenRouterClients;
}

interface ChatCompletionMessage {
  content?: string | Array<{ text?: string }> | null;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: ChatCompletionMessage }>;
  output_text?: string;
}

interface ResponsesApiResponse {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  output_text?: string;
}

interface ResponseTextDeltaEvent {
  delta?: string;
  text?: string;
  type?: string;
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

function extractTextFromResponsesOutput(
  data: ResponsesApiResponse | undefined | null
): string {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim().length > 0
  ) {
    return data.output_text.trim();
  }

  const fromStructuredOutput =
    data?.output
      ?.flatMap((outputItem) => outputItem.content ?? [])
      .map((contentItem) =>
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
          ? contentItem.text
          : ""
      )
      .join("") ?? "";

  return fromStructuredOutput.trim();
}

export function extractTextFromResponsesPayload(payload: unknown): string {
  if (!payload) {
    return "";
  }

  if (Array.isArray(payload)) {
    const parsedEvents = payload
      .map((entry) => {
        if (typeof entry === "string") {
          try {
            return JSON.parse(entry) as ResponseTextDeltaEvent;
          } catch {
            return null;
          }
        }
        return entry as ResponseTextDeltaEvent;
      })
      .filter((event): event is ResponseTextDeltaEvent => event !== null);

    const completedText = parsedEvents
      .filter(
        (event) =>
          event.type === "response.output_text.done" &&
          typeof event.text === "string"
      )
      .at(-1)?.text;

    if (completedText) {
      return completedText.trim();
    }

    return parsedEvents
      .map((event) => {
        if (
          event.type === "response.output_text.delta" &&
          typeof event.delta === "string"
        ) {
          return event.delta;
        }
        return "";
      })
      .join("")
      .trim();
  }

  if (typeof payload === "string") {
    const trimmedPayload = payload.trim();

    try {
      const parsed = JSON.parse(trimmedPayload) as unknown;
      return extractTextFromResponsesPayload(parsed);
    } catch {
      const streamEvents = extractJsonObjectsFromStream(trimmedPayload);
      if (streamEvents.length > 0) {
        return extractTextFromResponsesPayload(streamEvents);
      }
      return "";
    }
  }

  return extractTextFromResponsesOutput(payload as ResponsesApiResponse);
}

function extractJsonObjectsFromStream(raw: string): unknown[] {
  const events: unknown[] = [];
  let depth = 0;
  let startIndex = -1;
  let isInsideString = false;
  let isEscaped = false;

  for (let i = 0; i < raw.length; i++) {
    const currentCharacter = raw[i];

    if (isInsideString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (currentCharacter === "\\") {
        isEscaped = true;
        continue;
      }

      if (currentCharacter === '"') {
        isInsideString = false;
      }
      continue;
    }

    if (currentCharacter === '"') {
      isInsideString = true;
      continue;
    }

    if (currentCharacter === "{") {
      if (depth === 0) {
        startIndex = i;
      }
      depth += 1;
      continue;
    }

    if (currentCharacter === "}") {
      depth -= 1;
      if (depth === 0 && startIndex >= 0) {
        const eventAsString = raw.slice(startIndex, i + 1);
        try {
          events.push(JSON.parse(eventAsString) as unknown);
        } catch {
          // Ignore malformed chunks and continue parsing the stream.
        }
        startIndex = -1;
      }
    }
  }

  return events;
}

export async function generateResponse(input: {
  model: string;
  messages: Array<{
    role: "user" | "assistant" | "developer";
    content: string;
  }>;
  systemInstruction?: string;
}): Promise<{ provider: string; text: string }> {
  const fsClient = getFsClient();

  if (!fsClient) {
    throw new Error(
      "FranceStudent provider non initialisé (FS_API_KEY manquante)"
    );
  }

  const normalizedMessages = [
    ...(input.systemInstruction
      ? [{ role: "system" as const, content: input.systemInstruction }]
      : []),
    ...input.messages,
  ];

  let text = "";

  try {
    const response = (await fsClient.responses.create({
      model: input.model,
      input: normalizedMessages,
      stream: false,
    })) as ResponsesApiResponse;
    text = extractTextFromResponsesPayload(response);
  } catch (error) {
    const isNotFoundError =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 404;

    if (!isNotFoundError) {
      throw error;
    }

    const completion = await fsClient.chat.completions.create({
      model: input.model,
      messages: normalizedMessages,
    });
    text = extractTextFromChatCompletion(completion);
  }

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
  const providerModelId =
    fsModelMapping[modelId] ??
    ollamaModelMapping[modelId] ??
    hordeModelMapping[modelId] ??
    openRouterModelMapping[modelId];
  if (!providerModelId) {
    throw new Error(`Unsupported external text model: ${modelId}`);
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
      (
        message
      ): message is {
        role: "user" | "assistant" | "developer";
        content: string;
      } => message !== null
    );

  if (messages.length === 0) {
    throw new Error("External model requires at least one text message");
  }

  if (modelId.startsWith("ollama/")) {
    const ollamaClient = getOllamaClient();
    if (!ollamaClient) {
      throw new Error("Ollama provider non initialisé (OLLAMA_API_KEY manquante)");
    }
    const completion = await ollamaClient.chat.completions.create({
      model: providerModelId,
      messages: messages.map((message) => ({
        role:
          message.role === "developer"
            ? ("system" as const)
            : (message.role as "assistant" | "user"),
        content: message.content,
      })),
    });
    const text = extractTextFromChatCompletion(completion);
    if (!text) {
      throw new Error("Ollama API returned an empty response");
    }
    return { provider: "ollama", text };
  }

  if (modelId.startsWith("horde/")) {
    const hordeClient = getHordeClient();
    const completion = await hordeClient.chat.completions.create({
      model: providerModelId,
      messages: messages.map((message) => ({
        role:
          message.role === "developer"
            ? ("system" as const)
            : (message.role as "assistant" | "user"),
        content: message.content,
      })),
    });
    const text = extractTextFromChatCompletion(completion);
    if (!text) {
      throw new Error("AI Horde API returned an empty response");
    }
    return { provider: "horde", text };
  }

  if (modelId.startsWith("openrouter/")) {
    const openRouterClients = getOpenRouterClients();
    if (openRouterClients.length === 0) {
      throw new Error(
        "OpenRouter provider non initialisé (OPENROUTER_API_KEY_1/2/3 manquantes)"
      );
    }

    let lastError: unknown = null;
    for (const openRouterClient of openRouterClients) {
      try {
        const completion = await openRouterClient.chat.completions.create({
          model: providerModelId,
          messages: messages.map((message) => ({
            role:
              message.role === "developer"
                ? ("system" as const)
                : (message.role as "assistant" | "user"),
            content: message.content,
          })),
        });
        const text = extractTextFromChatCompletion(completion);
        if (!text) {
          throw new Error("OpenRouter API returned an empty response");
        }
        return { provider: "openrouter", text };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("OpenRouter API failed on all configured API keys");
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
  throw new Error(
    "Image generation provider is disabled. Only OpenAI FS text models are supported."
  );
}
