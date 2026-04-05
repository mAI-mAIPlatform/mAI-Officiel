import { auth } from "@/app/(auth)/auth";
import { getChatById, getStreamIdsByChatId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { getStreamContext } from "../../route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (!chat || chat.userId !== session.user.id) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  const streamContext = getStreamContext();
  if (!streamContext) {
    return new ChatbotError("offline:stream").toResponse();
  }

  const streamIds = await getStreamIdsByChatId({ chatId: id });
  if (!streamIds.length) {
    return new ChatbotError("not_found:chat").toResponse();
  }

  const recentStreamId = streamIds.at(-1);
  if (!recentStreamId) {
    return new ChatbotError("not_found:chat").toResponse();
  }

  const stream = await streamContext.resumeExistingStream(recentStreamId);

  if (!stream) {
    return new ChatbotError("not_found:stream").toResponse();
  }

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
