import { auth } from "@/app/(auth)/auth";
import { launchHordeGeneration } from "@/lib/ai/horde";

type GenerateRequest = {
  prompt?: string;
  mode?: "generate-image" | "edit-image";
  size?: "1024x1024" | "768x1024" | "1536x1024" | "1024x576";
  quality?: "eco" | "standard" | "high";
  quantity?: number;
  image?: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  const mode = body.mode ?? "generate-image";

  if (!prompt) {
    return Response.json({ error: "Prompt manquant" }, { status: 400 });
  }

  if (mode === "edit-image" && !body.image?.trim()) {
    return Response.json(
      { error: "Une image source est requise pour l'édition." },
      { status: 400 }
    );
  }

  try {
    const generation = await launchHordeGeneration({
      prompt,
      mode,
      size: body.size,
      quality: body.quality,
      quantity: body.quantity,
      sourceImage: body.image,
    });

    return Response.json(generation);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur lors du lancement de la génération.",
      },
      { status: 500 }
    );
  }
}
