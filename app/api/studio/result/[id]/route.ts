import { auth } from "@/app/(auth)/auth";
import { getHordeGenerationStatus } from "@/lib/ai/horde";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id?.trim()) {
    return Response.json({ error: "ID manquant" }, { status: 400 });
  }

  try {
    const status = await getHordeGenerationStatus(id);
    return Response.json(status);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur lors de la récupération du résultat.",
      },
      { status: 500 }
    );
  }
}
