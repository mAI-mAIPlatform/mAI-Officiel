import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  assignTagToChat,
  getChatById,
  getTagAssignmentCountForChat,
  getTagByIdForUser,
  getTagsByChatId,
  unassignTagFromChat,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { maxTagsPerChat } from "@/lib/tags";

const payloadSchema = z.object({
  chatId: z.string().uuid(),
  tagId: z.string().uuid(),
});

async function ensureOwnership(userId: string, chatId: string, tagId: string) {
  const [chatRecord, tagRecord] = await Promise.all([
    getChatById({ id: chatId }),
    getTagByIdForUser({ id: tagId, userId }),
  ]);

  return {
    hasChat: chatRecord?.userId === userId,
    hasTag: Boolean(tagRecord),
  };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const parsedPayload = payloadSchema.safeParse(await request.json());
  if (!parsedPayload.success) {
    return new ChatbotError(
      "bad_request:api",
      "Payload d'assignation invalide"
    ).toResponse();
  }

  const { chatId, tagId } = parsedPayload.data;

  const ownership = await ensureOwnership(session.user.id, chatId, tagId);

  if (!ownership.hasChat || !ownership.hasTag) {
    return Response.json({ error: "Chat ou tag introuvable" }, { status: 404 });
  }

  const assignmentCount = await getTagAssignmentCountForChat(chatId);
  if (assignmentCount >= maxTagsPerChat) {
    return Response.json(
      { error: `Un chat peut avoir au maximum ${maxTagsPerChat} tags.` },
      { status: 409 }
    );
  }

  await assignTagToChat({ chatId, tagId });
  const tags = await getTagsByChatId({ chatId, userId: session.user.id });

  return Response.json({ tags });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const parsedPayload = payloadSchema.safeParse(await request.json());
  if (!parsedPayload.success) {
    return new ChatbotError(
      "bad_request:api",
      "Payload de désassignation invalide"
    ).toResponse();
  }

  const { chatId, tagId } = parsedPayload.data;

  const ownership = await ensureOwnership(session.user.id, chatId, tagId);

  if (!ownership.hasChat || !ownership.hasTag) {
    return Response.json({ error: "Chat ou tag introuvable" }, { status: 404 });
  }

  await unassignTagFromChat({ chatId, tagId });
  const tags = await getTagsByChatId({ chatId, userId: session.user.id });

  return Response.json({ tags });
}
