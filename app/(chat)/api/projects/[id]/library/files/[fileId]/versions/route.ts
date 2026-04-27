import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getProjectFileVersionHistory } from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "viewer");
  if (permission.response) {
    return permission.response;
  }

  const versions = await getProjectFileVersionHistory(fileId);
  return NextResponse.json(versions);
}
