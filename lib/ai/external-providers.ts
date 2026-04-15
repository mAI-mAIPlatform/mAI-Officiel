import { affordableTextModels } from "@/lib/ai/affordable-models";
import OpenAI from "openai";

const COMET_API_BASE_URL =
  process.env.COMET_API_BASE_URL ?? "https://api.cometapi.com/v1";
const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL ??
  "https://generativelanguage.googleapis.com/v1beta";
const CEREBRAS_API_BASE_URL =
  process.env.CEREBRAS_API_BASE_URL ?? "https://api.cerebras.ai/v1";
const MISTRAL_API_BASE_URL =
  process.env.MISTRAL_API_BASE_URL ?? "https://api.mistral.ai/v1";
const HUGGINGFACE_API_BASE_URL =
  process.env.HUGGINGFACE_API_BASE_URL ??
  "https://router.huggingface.co/v1/chat/completions";
const FS_API_BASE_URL =
  process.env.FS_API_BASE_URL ?? "https://api.francestudent.org/v1";
const FS_TIMEOUT_MS = Number.parseInt(process.env.FS_API_TIMEOUT_MS ?? "10000", 10);
const FS_MAX_RETRIES = Number.parseInt(process.env.FS_API_MAX_RETRIES ?? "2", 10);
const RETRYABLE_FS_STATUS_CODES = new Set([401, 403, 408, 409, 429]);

export const cometTextModels = new Set(["gpt-5.4-nano", "gpt-5.4-mini"]);
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
export const cometImageModels = new Set([
  "flux-2-max",
  "kling-image",
  "flux-2-pro",
  "flux-2-flex",
]);
export const geminiCheapModels = new Set(
  affordableTextModels
    .map((model) => model.id)
    .filter((modelId) => modelId.startsWith("gemini-"))
);
export const huggingFaceCheapModels = new Set(
  affordableTextModels
    .map((model) => model.id)
    .filter((modelId) => modelId.startsWith("huggingface/"))
);

const cerebrasModelMapping: Record<string, string> = {
  "cerebras/llama3.1-8b": "llama3.1-8b",
  "cerebras/qwen-3-32b": "qwen-3-32b",
};

const mistralModelMapping: Record<string, string> = {
  "mistral-api/ministral-3b-latest": "ministral-3b-latest",
  "mistral-api/ministral-8b-latest": "ministral-8b-latest",
};

export const cerebrasCheapModels = new Set(Object.keys(cerebrasModelMapping));
export const mistralCheapModels = new Set(Object.keys(mistralModelMapping));

const cometKeys = [
  process.env.COMET_API_KEY_1,
  process.env.COMET_API_KEY_2,
].filter(Boolean) as string[];
const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean) as string[];
const cerebrasKeys = [process.env.CEREBRAS_API_KEY].filter(Boolean) as string[];
const mistralKeys = [process.env.MISTRAL_API_KEY].filter(Boolean) as string[];
const huggingFaceKeys = [process.env.HF_API_KEY].filter(Boolean) as string[];
const fsKeys = [
  process.env.FS_API_KEY_1,
  process.env.FS_API_KEY_2,
  process.env.FS_API_KEY_3,
].filter(Boolean) as string[];

// Alias pour rester compatible avec des IDs "marketing"/preview selon les périodes.
const geminiModelAliases: Record<string, string[]> = {
  "gemini-3.1-flash-lite-preview": [
    "gemini-3.1-flash-lite-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash-lite",
  ],
  "gemini-3-pro-preview": [
    "gemini-3-pro-preview",
    "gemini-3.1-pro-preview",
    "gemini-2.5-pro",
  ],
  "gemini-3.1-pro-preview": [
    "gemini-3.1-pro-preview",
    "gemini-3-pro-preview",
    "gemini-2.5-pro",
  ],
};

function getGeminiCandidateModelIds(modelId: string): string[] {
  const aliases = geminiModelAliases[modelId] ?? [modelId];
  return [...new Set(aliases)];
}

async function withFallback<T>(
  calls: Array<() => Promise<T>>,
  errorLabel: string
): Promise<T> {
  let lastError: unknown = null;

  for (const call of calls) {
    try {
      return await call();
    } catch (error) {
      lastError = error;
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "Erreur inconnue";
  throw new Error(`${errorLabel}: ${message}`);
}

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
    return (
      error.name === "AbortError" ||
      error.message.toLowerCase().includes("timeout") ||
      error.message.toLowerCase().includes("network")
    );
  }

  return false;
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
  const fallbackClient = createClientWithFallback({
    timeoutMs: input.timeoutMs,
  });

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

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

function extractTextFromGemini(data: GeminiResponse | undefined | null): string {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();
}

interface ChatCompletionMessage {
  content?: string | Array<{ text?: string }> | null;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: ChatCompletionMessage }>;
  output_text?: string;
}

function extractTextFromChatCompletion(data: ChatCompletionResponse | undefined | null): string {
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

interface ImagePayloadResponse {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  image_url?: string;
  output?: Array<{ url?: string }>;
}

function extractImagePayload(data: ImagePayloadResponse | undefined | null): {
  imageUrl?: string;
  imageBase64?: string;
} {
  const firstData = data?.data?.[0];

  if (typeof firstData?.url === "string") {
    return { imageUrl: firstData.url };
  }

  if (typeof firstData?.b64_json === "string") {
    return { imageBase64: firstData.b64_json };
  }

  if (typeof data?.image_url === "string") {
    return { imageUrl: data.image_url };
  }

  if (typeof data?.output?.[0]?.url === "string") {
    return { imageUrl: data.output[0].url };
  }

  return {};
}

export function isExternalTextModel(modelId: string): boolean {
  return (
    cometTextModels.has(modelId) ||
    fsTextModels.has(modelId) ||
    geminiCheapModels.has(modelId) ||
    huggingFaceCheapModels.has(modelId) ||
    cerebrasCheapModels.has(modelId) ||
    mistralCheapModels.has(modelId)
  );
}

export function runExternalTextModel(
  modelId: string,
  prompt: string,
  options?: { systemInstruction?: string }
): Promise<{ provider: string; text: string }> {
  const systemInstruction = options?.systemInstruction?.trim();

  if (cometTextModels.has(modelId)) {
    if (cometKeys.length === 0) {
      throw new Error("Aucune clé CometAPI configurée");
    }

    const cometCalls = cometKeys.map((apiKey, index) => async () => {
      const response = await fetch(`${COMET_API_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            ...(systemInstruction
              ? [{ role: "system", content: systemInstruction }]
              : []),
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `CometAPI clé ${index + 1} a échoué (${response.status})`
        );
      }

      const data = await response.json();
      const text = extractTextFromChatCompletion(data);

      if (!text) {
        throw new Error(`CometAPI clé ${index + 1} a renvoyé une réponse vide`);
      }

      return { provider: `cometapi-${index + 1}`, text };
    });

    return withFallback(cometCalls, "Échec fallback CometAPI texte");
  }

  if (geminiCheapModels.has(modelId)) {
    if (geminiKeys.length === 0) {
      throw new Error("Aucune clé Gemini configurée");
    }

    const modelCandidates = getGeminiCandidateModelIds(modelId);
    const geminiCalls = geminiKeys.map((apiKey, index) => async () => {
      const abortController = new AbortController();
      let lastStatus: number | undefined;

      try {
        const result = await Promise.any(
          modelCandidates.map(async (resolvedModelId) => {
            const response = await fetch(
              `${GEMINI_API_BASE_URL}/models/${resolvedModelId}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: abortController.signal,
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  ...(systemInstruction
                    ? {
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                      }
                    : {}),
                  generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 1024,
                  },
                }),
              }
            );

            if (!response.ok) {
              lastStatus = response.status;
              throw new Error(
                `Gemini clé ${index + 1} a échoué (${response.status})`
              );
            }

            const data = await response.json();
            const text = extractTextFromGemini(data);

            if (!text) {
              throw new Error(`Gemini clé ${index + 1} a renvoyé une réponse vide`);
            }

            return { provider: `gemini-${index + 1}`, text };
          })
        );

        // Abort the remaining requests once one has succeeded
        abortController.abort();
        return result;
      } catch (aggregateError) {
        throw new Error(
          `Gemini clé ${index + 1} a échoué (${lastStatus ?? "status inconnu"})`
        );
      }
    });

    return withFallback(geminiCalls, "Échec fallback Gemini");
  }

  if (fsTextModels.has(modelId)) {
    const providerModelId = fsModelMapping[modelId];
    if (!providerModelId) {
      throw new Error("Mapping modèle FranceStudent introuvable");
    }

    return generateResponse({
      model: providerModelId,
      prompt,
      systemInstruction,
    });
  }

  if (cerebrasCheapModels.has(modelId)) {
    if (cerebrasKeys.length === 0) {
      throw new Error("Aucune clé Cerebras configurée");
    }

    const providerModelId = cerebrasModelMapping[modelId];
    if (!providerModelId) {
      throw new Error("Mapping modèle Cerebras introuvable");
    }

    const cerebrasCalls = cerebrasKeys.map((apiKey, index) => async () => {
      const response = await fetch(
        `${CEREBRAS_API_BASE_URL}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: providerModelId,
            messages: [
              ...(systemInstruction
                ? [{ role: "system", content: systemInstruction }]
                : []),
              { role: "user", content: prompt },
            ],
            temperature: 0.4,
            max_completion_tokens: 1200,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Cerebras clé ${index + 1} a échoué (${response.status})`
        );
      }

      const data = await response.json();
      const text = extractTextFromChatCompletion(data);

      if (!text) {
        throw new Error(`Cerebras clé ${index + 1} a renvoyé une réponse vide`);
      }

      return { provider: `cerebras-${index + 1}`, text };
    });

    return withFallback(cerebrasCalls, "Échec fallback Cerebras");
  }

  if (mistralCheapModels.has(modelId)) {
    if (mistralKeys.length === 0) {
      throw new Error("Aucune clé Mistral configurée");
    }

    const providerModelId = mistralModelMapping[modelId];
    if (!providerModelId) {
      throw new Error("Mapping modèle Mistral introuvable");
    }

    const mistralCalls = mistralKeys.map((apiKey, index) => async () => {
      const response = await fetch(`${MISTRAL_API_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: providerModelId,
          messages: [
            ...(systemInstruction
              ? [{ role: "system", content: systemInstruction }]
              : []),
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 1200,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Mistral clé ${index + 1} a échoué (${response.status})`
        );
      }

      const data = await response.json();
      const text = extractTextFromChatCompletion(data);

      if (!text) {
        throw new Error(`Mistral clé ${index + 1} a renvoyé une réponse vide`);
      }

      return { provider: `mistral-${index + 1}`, text };
    });

    return withFallback(mistralCalls, "Échec fallback Mistral");
  }

  if (huggingFaceCheapModels.has(modelId)) {
    if (huggingFaceKeys.length === 0) {
      throw new Error("HF_API_KEY manquante");
    }

    const providerModelId = modelId.replace("huggingface/", "");

    const hfCalls = huggingFaceKeys.map((apiKey, index) => async () => {
      const response = await fetch(HUGGINGFACE_API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: providerModelId,
          messages: [
            ...(systemInstruction
              ? [{ role: "system", content: systemInstruction }]
              : []),
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 1200,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Hugging Face clé ${index + 1} a échoué (${response.status})`
        );
      }

      const data = await response.json();
      const text = extractTextFromChatCompletion(data);

      if (!text) {
        throw new Error(
          `Hugging Face clé ${index + 1} a renvoyé une réponse vide`
        );
      }

      return { provider: `huggingface-${index + 1}`, text };
    });

    return withFallback(hfCalls, "Échec fallback Hugging Face");
  }

  throw new Error("Modèle externe texte non supporté");
}

export function runCometImageModel(
  action: "generate-image" | "edit-image",
  model: string,
  prompt: string,
  image?: string
): Promise<{ provider: string; imageUrl?: string; imageBase64?: string }> {
  if (!cometImageModels.has(model)) {
    throw new Error("Modèle CometAPI image non supporté");
  }

  if (cometKeys.length === 0) {
    throw new Error("Aucune clé CometAPI configurée");
  }

  const endpoint =
    action === "edit-image"
      ? `${COMET_API_BASE_URL}/images/edits`
      : `${COMET_API_BASE_URL}/images/generations`;

  const calls = cometKeys.map((apiKey, index) => async () => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        ...(image ? { image } : {}),
        size: "1024x1024",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `CometAPI image clé ${index + 1} a échoué (${response.status})`
      );
    }

    const data = await response.json();
    const parsed = extractImagePayload(data);

    if (!parsed.imageBase64 && !parsed.imageUrl) {
      throw new Error(`CometAPI image clé ${index + 1} réponse invalide`);
    }

    return { provider: `cometapi-${index + 1}`, ...parsed };
  });

  return withFallback(calls, "Échec fallback CometAPI image");
}
