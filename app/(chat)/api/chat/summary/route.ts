import { generateText } from "ai";
import { auth } from "@/app/(auth)/auth";
import { getLanguageModel } from "@/lib/ai/providers";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages, getTextFromMessage } from "@/lib/utils";

const lengthPromptMap = {
  short: "Fais un résumé ultra-court (2-3 puces max).",
  medium: "Fais un résumé concis et utile en 5-7 puces.",
  long: "Fais un résumé détaillé avec contexte, décisions et prochaines actions.",
} as const;

export async function POST(request: Request) {
  const session = await auth();
  const body = (await request.json()) as {
    chatId?: string;
    length?: keyof typeof lengthPromptMap;
  };

  if (!body.chatId) {
    return Response.json({ error: "chatId requis" }, { status: 400 });
  }

  const [chat, dbMessages] = await Promise.all([
    getChatById({ id: body.chatId }),
    getMessagesByChatId({ id: body.chatId }),
  ]);

  if (!chat) {
    return Response.json({ error: "Discussion introuvable" }, { status: 404 });
  }

  if (
    chat.visibility === "private" &&
    (!session?.user || session.user.id !== chat.userId)
  ) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const uiMessages = convertToUIMessages(dbMessages);
  const conversation = uiMessages
    .map(
      (message) =>
        `${message.role.toUpperCase()}: ${getTextFromMessage(message)}`
    )
    .join("\n")
    .slice(0, 20_000);

  const length = body.length ?? "medium";

  const result = await generateText({
    model: getLanguageModel("openai/gpt-5.4-nano"),
    system:
      "Tu résumes des conversations utilisateur/assistant en français clair. Tu dois rester factuel et actionnable.",
    prompt: `${lengthPromptMap[length]}\n\nConversation:\n${conversation}`,
  });

  return Response.json({ summary: result.text });
}
