const COMET_API_BASE_URL =
  process.env.COMET_API_BASE_URL ?? "https://api.cometapi.com/v1";
const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";

export const cometTextModels = new Set(["gpt-5.4-nano", "gpt-5.4-mini"]);
export const cometImageModels = new Set([
  "flux-2-max",
  "kling-image",
  "flux-2-pro",
  "flux-2-flex",
]);
export const geminiCheapModels = new Set([
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
]);

const cometKeys = [process.env.COMET_API_KEY_1, process.env.COMET_API_KEY_2].filter(
  Boolean
) as string[];
const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

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

function extractTextFromGemini(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part: { text?: string }) => part.text ?? "")
    .join("\n")
    .trim();
}

function extractImagePayload(data: any): { imageUrl?: string; imageBase64?: string } {
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
  return cometTextModels.has(modelId) || geminiCheapModels.has(modelId);
}

export async function runExternalTextModel(
  modelId: string,
  prompt: string
): Promise<{ provider: string; text: string }> {
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
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`CometAPI clé ${index + 1} a échoué (${response.status})`);
      }

      const data = await response.json();
      const text =
        data?.choices?.[0]?.message?.content ?? data?.output_text ?? "";

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

    const geminiCalls = geminiKeys.map((apiKey, index) => async () => {
      const response = await fetch(
        `${GEMINI_API_BASE_URL}/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini clé ${index + 1} a échoué (${response.status})`);
      }

      const data = await response.json();
      const text = extractTextFromGemini(data);

      if (!text) {
        throw new Error(`Gemini clé ${index + 1} a renvoyé une réponse vide`);
      }

      return { provider: `gemini-${index + 1}`, text };
    });

    return withFallback(geminiCalls, "Échec fallback Gemini");
  }

  throw new Error("Modèle externe texte non supporté");
}

export async function runCometImageModel(
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
      throw new Error(`CometAPI image clé ${index + 1} a échoué (${response.status})`);
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
