import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId, getMessagesByChatId } from "@/lib/db/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const chats = await getChatsByUserId({
      id: session.user.id,
      limit: 1000,
      startingAfter: null,
      endingBefore: null
    });

    const exportData = {
      user: session.user,
      chats: [] as any[],
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
        "Content-Disposition": `attachment; filename="export_mCoder_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
