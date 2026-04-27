import { generateText } from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

const bodySchema = z.object({
  subject: z.string().min(1).max(120),
  strengths: z.array(z.string().min(1)).max(5),
  weaknesses: z.array(z.string().min(1)).max(5),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const model = getLanguageModel(DEFAULT_CHAT_MODEL);
    const { text } = await generateText({
      model,
      prompt: `Rédige exactement 3 phrases en français pour un élève.
Matière: ${parsed.data.subject}
Forces: ${parsed.data.strengths.join(", ") || "aucune"}
Axes d'amélioration: ${parsed.data.weaknesses.join(", ") || "aucun"}
Contraintes: ton motivant, suggestions concrètes de quiz à faire ensuite, pas de markdown.`,
    });

    return Response.json({ summary: text.trim() });
  } catch (error) {
    console.error("competency summary error", error);
    return Response.json({ error: "Résumé indisponible." }, { status: 500 });
  }
}
