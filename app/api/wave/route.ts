import { auth } from "@/app/(auth)/auth";
import { runExternalTextModel } from "@/lib/ai/external-providers";

const SUNO_ENDPOINT = "https://api.sunoapi.org/api/v1/generate";

type WaveRequest =
  | {
      action: "lyrics";
      prompt: string;
      style?: string;
      mood?: string;
      language?: string;
    }
  | {
      action: "generate";
      customMode?: boolean;
      instrumental?: boolean;
      model: "V5_5" | "V5" | "V4_5PLUS" | "V4_5ALL" | "V4_5" | "V4";
      callBackUrl?: string;
      prompt: string;
      style?: string;
      title?: string;
      personaId?: string;
      personaModel?: string;
      negativeTags?: string;
      vocalGender?: "m" | "f" | "n";
      styleWeight?: number;
      weirdnessConstraint?: number;
      audioWeight?: number;
    };

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: WaveRequest;
  try {
    body = (await request.json()) as WaveRequest;
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (body.action === "lyrics") {
    const prompt = asTrimmedString(body.prompt);
    if (!prompt) {
      return Response.json(
        { error: "Le prompt de lyrics est requis" },
        { status: 400 }
      );
    }

    try {
      const generationPrompt = [
        "Crée des paroles de chanson structurées.",
        "Retourne uniquement les lyrics finaux en français.",
        body.style ? `Style: ${body.style}` : "",
        body.mood ? `Ambiance: ${body.mood}` : "",
        body.language ? `Langue cible: ${body.language}` : "",
        `Brief utilisateur: ${prompt}`,
      ]
        .filter(Boolean)
        .join("\n");

      const result = await runExternalTextModel("openai/gpt-5.4-nano", [
        { role: "user", content: generationPrompt },
      ]);

      return Response.json({ type: "lyrics", ...result });
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Erreur génération lyrics",
        },
        { status: 500 }
      );
    }
  }

  if (body.action !== "generate") {
    return Response.json({ error: "Action non supportée" }, { status: 400 });
  }

  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "SUNO_API_KEY manquante sur le serveur." },
      { status: 500 }
    );
  }

  const prompt = asTrimmedString(body.prompt);
  if (!prompt) {
    return Response.json({ error: "Le prompt est requis" }, { status: 400 });
  }

  const payload = {
    customMode: body.customMode ?? true,
    instrumental: body.instrumental ?? false,
    model: body.model,
    callBackUrl: asTrimmedString(body.callBackUrl) || undefined,
    prompt,
    style: asTrimmedString(body.style) || undefined,
    title: asTrimmedString(body.title) || undefined,
    personaId: asTrimmedString(body.personaId) || undefined,
    personaModel: asTrimmedString(body.personaModel) || undefined,
    negativeTags: asTrimmedString(body.negativeTags) || undefined,
    vocalGender: body.vocalGender,
    styleWeight: body.styleWeight,
    weirdnessConstraint: body.weirdnessConstraint,
    audioWeight: body.audioWeight,
  };

  try {
    const response = await fetch(SUNO_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      return Response.json(
        {
          error:
            typeof data.error === "string"
              ? data.error
              : "Erreur génération musique",
          details: data,
        },
        { status: response.status }
      );
    }

    return Response.json({ type: "music", provider: "sunoapi", data });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur réseau SUNO API",
      },
      { status: 500 }
    );
  }
}
