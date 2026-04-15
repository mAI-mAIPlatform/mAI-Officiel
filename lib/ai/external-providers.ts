import OpenAI from "openai";

const FS_API_BASE_URL =
  process.env.FS_API_BASE_URL ?? "https://api.francestudent.org/v1";
const FS_TIMEOUT_MS = Number.parseInt(
  process.env.FS_API_TIMEOUT_MS ?? "10000",
  10
);
const FS_MAX_RETRIES = Number.parseInt(
  process.env.FS_API_MAX_RETRIES ?? "2",
  10
);

const RETRYABLE_FS_STATUS_CODES = new Set([401, 403, 408, 409, 429]);

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
const fsKeys = [
  process.env.FS_API_KEY_1,
  process.env.FS_API_KEY_2,
  process.env.FS_API_KEY_3,
].filter(Boolean) as string[];

// Comet image provider has been intentionally disabled.
export const cometImageModels = new Set<string>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extractErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof (error as { cause?: unknown }).cause === "object" &&
    (error as { cause?: { status?: unknown } }).cause !== null &&
    typeof (error as { cause?: { status?: unknown } }).cause?.status === "number"
  ) {
    return (error as { cause: { status: number } }).cause.status;
  }

  return undefined;
}

function isRetryableFsError(error: unknown): boolean {
  const status = extractErrorStatus(error);
  if (typeof status === "number") {
    return RETRYABLE_FS_STATUS_CODES.has(status) || status >= 500;
  }

  if (error instanceof Error) {
    const lowerMessage = error.message.toLowerCase();
    return (
      error.name === "AbortError" ||
      lowerMessage.includes("timeout") ||
      lowerMessage.includes("network")
    );
  }

  return false;
}

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

export function createClientWithFallback(options?: {
  timeoutMs?: number;
  maxRetries?: number;
}) {
  const timeoutMs = options?.timeoutMs ?? FS_TIMEOUT_MS;
  const maxRetries = options?.maxRetries ?? FS_MAX_RETRIES;

  if (fsKeys.length === 0) {
    throw new Error(
      "Missing API keys: define FS_API_KEY_1, FS_API_KEY_2, or FS_API_KEY_3."
    );
  }

  const clients = fsKeys.map((apiKey, index) => ({
    keyIndex: index + 1,
    client: new OpenAI({
      apiKey,
      baseURL: FS_API_BASE_URL,
    }),
  }));

  return {
    async execute<T>(
      operation: (
        client: OpenAI,
        context: { keyIndex: number; signal: AbortSignal }
      ) => Promise<T>
    ): Promise<T> {
      let lastError: unknown = null;

      for (const { client, keyIndex } of clients) {
        for (let retryAttempt = 0; retryAttempt <= maxRetries; retryAttempt += 1) {
          const abortController = new AbortController();
          const timeout = setTimeout(() => abortController.abort(), timeoutMs);

          try {
            const result = await operation(client, {
              keyIndex,
              signal: abortController.signal,
            });
            clearTimeout(timeout);
            return result;
          } catch (error) {
            clearTimeout(timeout);
            lastError = error;
            const retryable = isRetryableFsError(error);
            const hasRetry = retryAttempt < maxRetries;

            if (retryable && hasRetry) {
              const backoffMs = 500 * 2 ** retryAttempt;
              console.warn(
                `API KEY ${keyIndex} attempt ${retryAttempt + 1} failed, retrying in ${backoffMs}ms...`
              );
              await sleep(backoffMs);
              continue;
            }

            if (keyIndex < clients.length) {
              console.warn(`API KEY ${keyIndex} failed, switching...`);
            }

            break;
          }
        }
      }

      console.error("All API keys failed");
      const details =
        lastError instanceof Error ? lastError.message : "unknown provider error";
      throw new Error(`All API keys failed: ${details}`);
    },
  };
}

export async function generateResponse(input: {
  model: string;
  prompt: string;
  systemInstruction?: string;
  timeoutMs?: number;
}): Promise<{ provider: string; text: string }> {
  const fallbackClient = createClientWithFallback({ timeoutMs: input.timeoutMs });

  return fallbackClient.execute(async (client, { keyIndex, signal }) => {
    const completion = await client.chat.completions.create(
      {
        model: input.model,
        messages: [
          ...(input.systemInstruction
            ? [{ role: "developer" as const, content: input.systemInstruction }]
            : []),
          { role: "user" as const, content: input.prompt },
        ],
      },
      { signal }
    );

    const text = extractTextFromChatCompletion(completion);

    if (!text) {
      throw new Error(`FranceStudent key ${keyIndex} returned an empty response`);
    }

    return { provider: `francestudent-${keyIndex}`, text };
  });
}

export function isExternalTextModel(modelId: string): boolean {
  return fsTextModels.has(modelId);
}

export async function runExternalTextModel(
  modelId: string,
  prompt: string,
  options?: { systemInstruction?: string }
): Promise<{ provider: string; text: string }> {
  const providerModelId = fsModelMapping[modelId];

  if (!providerModelId) {
    throw new Error("Unsupported external text model");
  }

  return generateResponse({
    model: providerModelId,
    prompt,
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
