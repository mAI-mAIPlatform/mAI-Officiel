import { auth } from "@/app/(auth)/auth";
import {
  cometImageModels,
  isExternalTextModel,
  runCometImageModel,
  runExternalTextModel,
} from "@/lib/ai/external-providers";

type StudioRequest = {
  action: "text" | "generate-image" | "edit-image";
  model: string;
  prompt: string;
  image?: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: StudioRequest;
  try {
    body = (await request.json()) as StudioRequest;
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();

  if (!prompt) {
    return Response.json({ error: "Le prompt est requis" }, { status: 400 });
  }

  try {
    if (body.action === "text") {
      if (!isExternalTextModel(body.model)) {
        return Response.json(
          { error: "Modèle texte non supporté" },
          { status: 400 }
        );
      }

      const result = await runExternalTextModel(body.model, prompt);
      return Response.json({ type: "text", ...result });
    }

    if (body.action === "generate-image" || body.action === "edit-image") {
      if (!cometImageModels.has(body.model)) {
        return Response.json(
          { error: "Modèle image non supporté" },
          { status: 400 }
        );
      }

      if (body.action === "edit-image" && !body.image?.trim()) {
        return Response.json(
          { error: "Une image source est requise pour l'édition" },
          { status: 400 }
        );
      }

      const result = await runCometImageModel(
        body.action,
        body.model,
        prompt,
        body.image
      );

      return Response.json({ type: "image", ...result });
    }

    return Response.json({ error: "Action non supportée" }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erreur studio" },
      { status: 500 }
    );
  }
}
