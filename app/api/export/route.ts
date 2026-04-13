import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId, getMessagesByChatId } from "@/lib/db/queries";
import { type Chat, type DBMessage } from "@/lib/db/schema";

export async function GET(_req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const chats = await getChatsByUserId({
      id: session.user.id,
      limit: 1000,
      startingAfter: null,
      endingBefore: null,
    });

    const exportData = {
      user: session.user,
      chats: [] as Array<Chat & { messages: DBMessage[] }>,
    };

    for (const chat of chats.chats) {
      const messages = await getMessagesByChatId({ id: chat.id });
      exportData.chats.push({
        ...chat,
        messages,
      });
    }

    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="export_mCoder_${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error({
      message: "Export error",
      userId: session.user.id,
      error,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
