import { auth } from "@/app/(auth)/auth";
import { getHordeGenerationStatus } from "@/lib/ai/horde";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const id = (await params).id;
    const status = await getHordeGenerationStatus(id);

    if (status.faulted) {
      return Response.json({
        finished: true,
        error: "Génération échouée (faulted)",
      });
    }

    if (status.done && status.generations && status.generations.length > 0) {
      return Response.json({
        finished: true,
        imageUrl: status.generations[0].img,
      });
    }

    return Response.json({ finished: false, status });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erreur status Horde" },
      { status: 500 }
    );
  }
}
