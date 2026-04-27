import { generateText } from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

const bodySchema = z.object({
  subject: z.string().min(1).max(120),
  progressPercent: z.number().min(0).max(100),
  weakThemes: z.array(z.string().min(1)).max(5),
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
      prompt: `Rédige un message d'encouragement personnalisé en français, maximum 28 mots.
Matière: ${parsed.data.subject}
Progression récente: ${parsed.data.progressPercent}%
Sous-thèmes faibles: ${parsed.data.weakThemes.join(", ")}
Le ton doit être positif, précis et motivant.`
    });

    return Response.json({ message: text.trim() });
  } catch (error) {
    console.error("quizzly encouragement error", error);
    return Response.json({ error: "Message indisponible." }, { status: 500 });
  }
}
