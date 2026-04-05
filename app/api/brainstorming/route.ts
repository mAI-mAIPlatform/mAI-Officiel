import { streamText } from "ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const systemPrompt = `Tu es un partenaire de réflexion Brainstorming fonctionnant en Mode Socrate.
Tes règles :
1. Tu NE DOIS PAS juste donner la réponse complète ou faire tout le travail à la place de l'utilisateur.
2. Tu DOIS poser des questions de relance ciblées pour faire réfléchir l'utilisateur et approfondir ses idées.
3. Lorsque tu proposes des pistes ou des résumés d'idées, utilise TOUJOURS des listes à puces claires ou des structures de plans bien organisées.
4. Encourage la créativité et la réflexion critique.`;

    const result = streamText({
      model: getLanguageModel(DEFAULT_CHAT_MODEL),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Brainstorming error", error);
    return new Response(JSON.stringify({ error: "Une erreur s'est produite." }), { status: 500 });
  }
}
