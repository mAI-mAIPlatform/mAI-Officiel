import { generateText } from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

const bodySchema = z.object({
  prompt: z.string().min(3).max(4000),
  runtime: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const model = getLanguageModel(DEFAULT_CHAT_MODEL);
    const { text } = await generateText({
      model,
      prompt: `Tu es un assistant de programmation pour un bac à sable.
Runtime ciblé: ${parsed.data.runtime}.
Génère du code exécutable et bref.
Réponds avec 2 sections:
1) "Explication" en 1-3 lignes.
2) "Code" dans un bloc markdown triple backticks.

Demande utilisateur:
${parsed.data.prompt}`,
    });

    return Response.json({ answer: text });
  } catch (error) {
    console.error("assistant code-interpreter error", error);
    return Response.json({ error: "Assistant indisponible." }, { status: 500 });
  }
}
