import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  assignChatToProject,
  getChatById,
  getChatsByProjectId,
} from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

const importChatSchema = z.object({
  chatId: z.string().uuid(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "viewer");
  if (permission.response) {
    return permission.response;
  }

  const chats = await getChatsByProjectId({
    projectId: id,
    userId: session.user.id,
  });

  return NextResponse.json(chats);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "editor");
  if (permission.response) {
    return permission.response;
  }

  const parsed = importChatSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const chat = await getChatById({ id: parsed.data.chatId });
  if (!chat || chat.userId !== session.user.id) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const [updated] = await assignChatToProject({
    chatId: parsed.data.chatId,
    projectId: id,
    userId: session.user.id,
  });

  return NextResponse.json(updated);
}
