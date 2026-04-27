import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { duplicateProjectForUser } from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

export async function POST(
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

  const duplicated = await duplicateProjectForUser(id, session.user.id);

  if (!duplicated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(duplicated, { status: 201 });
}
