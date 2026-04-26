import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getChatsByProjectId,
  getMemoryEntriesByUser,
  getMessagesByChatIds,
} from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";
import { convertToUIMessages, getTextFromMessage } from "@/lib/utils";

type SummaryPayload = {
  kind?: string;
  chatId?: string;
  summary?: string;
  createdAt?: string;
};

export async function GET(
  request: Request,
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

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const summaryQuery = (searchParams.get("summary") ?? "").trim().toLowerCase();
  const textQuery = (searchParams.get("q") ?? "").trim().toLowerCase();

  const chats = await getChatsByProjectId({ projectId: id });
  const messages = await getMessagesByChatIds({ ids: chats.map((chat) => chat.id) });
  const byChat = new Map<string, string>();

  for (const message of messages) {
    const ui = convertToUIMessages([message])[0];
    const text = getTextFromMessage(ui).toLowerCase();
    const previous = byChat.get(message.chatId) ?? "";
    byChat.set(message.chatId, `${previous}\n${text}`);
  }

  const memoryEntries = await getMemoryEntriesByUser(session.user.id, id);
  const summaries = memoryEntries
    .filter((entry) => entry.type === "summary")
    .map((entry) => {
      try {
        return JSON.parse(entry.content) as SummaryPayload;
      } catch {
        return null;
      }
    })
    .filter((value): value is SummaryPayload => Boolean(value?.chatId && value.summary));

  const latestSummaryByChat = new Map<string, SummaryPayload>();
  for (const item of summaries) {
    const prev = latestSummaryByChat.get(item.chatId as string);
    const itemDate = new Date(item.createdAt ?? 0).getTime();
    const prevDate = new Date(prev?.createdAt ?? 0).getTime();
    if (!prev || itemDate >= prevDate) {
      latestSummaryByChat.set(item.chatId as string, item);
    }
  }

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (toDate) {
    toDate.setHours(23, 59, 59, 999);
  }

  const history = chats
    .filter((chat) => {
      if (fromDate && chat.createdAt < fromDate) {
        return false;
      }
      if (toDate && chat.createdAt > toDate) {
        return false;
      }

      const summary = latestSummaryByChat.get(chat.id)?.summary?.toLowerCase() ?? "";
      const allMessages = byChat.get(chat.id) ?? "";

      if (summaryQuery && !summary.includes(summaryQuery)) {
        return false;
      }
      if (textQuery && !allMessages.includes(textQuery)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((chat) => ({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      summary: latestSummaryByChat.get(chat.id)?.summary ?? null,
      preview: (byChat.get(chat.id) ?? "").trim().slice(0, 260),
    }));

  return NextResponse.json(history);
}
