import { generateText } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getLanguageModel } from "@/lib/ai/providers";
import {
  createMemoryEntry,
  getChatById,
  getMessagesByChatId,
} from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";
import { convertToUIMessages, getTextFromMessage } from "@/lib/utils";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; chatId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, chatId } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "viewer");
  if (permission.response) {
    return permission.response;
  }

  const [chat, dbMessages] = await Promise.all([
    getChatById({ id: chatId }),
    getMessagesByChatId({ id: chatId }),
  ]);

  if (!chat || chat.projectId !== id) {
    return NextResponse.json({ error: "Chat introuvable" }, { status: 404 });
  }

  const uiMessages = convertToUIMessages(dbMessages);
  const conversation = uiMessages
    .map((message) => `${message.role.toUpperCase()}: ${getTextFromMessage(message)}`)
    .join("\n")
    .slice(0, 40_000);

  const result = await generateText({
    model: getLanguageModel("openai/gpt-5.4-nano"),
    system:
      "Tu rédiges des résumés de conversations de projet. Réponds en français, au format structuré avec sections: Contexte, Décisions, Actions, Points ouverts.",
    prompt: `Résume cette conversation de projet:\n\n${conversation}`,
  });

  const summary = result.text.trim();

  await createMemoryEntry({
    userId: session.user.id,
    projectId: id,
    type: "summary",
    content: JSON.stringify({
      kind: "summary",
      chatId,
      chatTitle: chat.title,
      summary,
      createdAt: new Date().toISOString(),
    }),
  });

  return NextResponse.json({ summary });
}
