const AI_HORDE_BASE_URL = "https://aihorde.net/api/v2/generate";
const AI_HORDE_API_KEY = process.env.AI_HORDE_API_KEY ?? "0000000000";
const AI_HORDE_CLIENT_AGENT =
  process.env.AI_HORDE_CLIENT_AGENT ?? "mAI-Officiel:studio:0.9.9";

type HordeLaunchInput = {
  prompt: string;
  mode: "generate-image" | "edit-image";
  size?: "1024x1024" | "768x1024" | "1536x1024" | "1024x576";
  quality?: "eco" | "standard" | "high";
  quantity?: number;
  sourceImage?: string;
};

type HordeStatusResponse = {
  done?: boolean;
  faulted?: boolean;
  generations?: Array<{ img?: string }>;
  message?: string;
};

function parseSize(size: HordeLaunchInput["size"]): { height: number; width: number } {
  if (size === "1536x1024") return { height: 1024, width: 1536 };
  if (size === "768x1024") return { height: 1024, width: 768 };
  if (size === "1024x576") return { height: 576, width: 1024 };

  return { height: 1024, width: 1024 };
}

function parseSteps(quality: HordeLaunchInput["quality"]): number {
  if (quality === "eco") return 15;
  if (quality === "high") return 35;
  return 24;
}

function toBase64Image(image: string): string {
  if (!image.startsWith("data:image/")) {
    return image;
  }

  const [, base64Payload] = image.split(",", 2);
  return base64Payload ?? image;
}

export async function launchHordeGeneration(input: HordeLaunchInput) {
  const { height, width } = parseSize(input.size);
  const steps = parseSteps(input.quality);
  const quantity = Math.min(4, Math.max(1, Math.floor(input.quantity ?? 1)));

  const response = await fetch(`${AI_HORDE_BASE_URL}/async`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: AI_HORDE_API_KEY,
      "Client-Agent": AI_HORDE_CLIENT_AGENT,
    },
    body: JSON.stringify({
      prompt: input.prompt,
      params: {
        sampler_name: "k_euler",
        width,
        height,
        steps,
        n: quantity,
      },
      ...(input.mode === "edit-image" && input.sourceImage
        ? {
            source_image: toBase64Image(input.sourceImage),
            source_processing: "img2img",
          }
        : {}),
    }),
  });

  const payload = (await response.json()) as { id?: string; message?: string };

  if (!response.ok || !payload.id) {
    throw new Error(payload.message ?? "Impossible de lancer la génération AI Horde.");
  }

  return {
    id: payload.id,
    message: payload.message ?? "Génération lancée 🚀",
  };
}

export async function getHordeGenerationStatus(id: string) {
  const response = await fetch(`${AI_HORDE_BASE_URL}/status/${id}`, {
    headers: {
      apikey: AI_HORDE_API_KEY,
      "Client-Agent": AI_HORDE_CLIENT_AGENT,
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as HordeStatusResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? "Impossible de récupérer le statut AI Horde.");
  }

  const images = (payload.generations ?? [])
    .map((generation) => generation.img?.trim() ?? "")
    .filter((image) => image.length > 0);

  if (images.length === 0) {
    return {
      status: payload.done ? "done" : "processing",
      message: payload.done
        ? "Génération terminée mais aucune image n'a été retournée."
        : "Image en cours de génération ⏳",
    } as const;
  }

  return {
    status: "done",
    images,
  } as const;
}
