import { generateText } from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

const bodySchema = z.object({
  name: z.string().min(1).max(240),
  content: z.string().min(1).max(12000),
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
      prompt: `Résume ce fichier en français avec:
- 4 puces max
- 1 section "Points clés"
- 1 section "Actions suggérées"

Nom: ${parsed.data.name}
Contenu:
${parsed.data.content}`,
    });

    return Response.json({ summary: text });
  } catch (error) {
    console.error("library summarize error", error);
    return Response.json({ error: "Résumé indisponible." }, { status: 500 });
  }
}
