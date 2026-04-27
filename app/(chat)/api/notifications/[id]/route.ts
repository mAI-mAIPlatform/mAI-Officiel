import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { markNotificationAsRead } from "@/lib/db/queries";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [updated] = await markNotificationAsRead(id, session.user.id);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
