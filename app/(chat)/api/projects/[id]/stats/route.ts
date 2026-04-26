import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getProjectById, getProjectStatsById } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const item = await getProjectById(id);

  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stats = await getProjectStatsById(id);
  return NextResponse.json(stats);
}
