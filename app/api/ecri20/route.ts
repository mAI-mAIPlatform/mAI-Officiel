import { streamText } from "ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

export async function POST(request: Request) {
  try {
    const { prompt, tone, format } = (await request.json()) as {
      prompt?: string;
      tone?: string;
      format?: string;
    };

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Le texte d'instructions est requis." }), { status: 400 });
    }

    const systemPrompt = `Tu es Ecri20, une IA de rédaction augmentée experte.
Ton objectif est de rédiger un texte en suivant les instructions de l'utilisateur, mais en adoptant le ton et le format spécifiés.

Format demandé : ${format || "Format libre"}
Ton demandé : ${tone || "Ton libre"}

Adapte parfaitement ton style de rédaction (vocabulaire, structure, longueur) pour correspondre exactement à ce format et à ce ton.`;

    const result = streamText({
      model: getLanguageModel(DEFAULT_CHAT_MODEL),
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Ecri20 error", error);
    return new Response(JSON.stringify({ error: "Une erreur s'est produite lors de la génération." }), { status: 500 });
  }
}
