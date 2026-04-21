import { auth } from "@/app/(auth)/auth";
import { launchHordeGeneration } from "@/lib/ai/horde";

type StudioGenerateRequest = {
  model: string;
  prompt: string;
  size: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: StudioGenerateRequest;
  try {
    body = (await request.json()) as StudioGenerateRequest;
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!body.prompt?.trim()) {
    return Response.json({ error: "Le prompt est requis" }, { status: 400 });
  }

  try {
    const result = await launchHordeGeneration({
      model: body.model,
      prompt: body.prompt,
      size: body.size || "1024x1024",
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur generation Horde",
      },
      { status: 500 }
    );
  }
}
