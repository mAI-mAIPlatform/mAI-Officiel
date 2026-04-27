import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createProjectFile } from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  parentId: z.string().uuid().optional().nullable(),
});

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

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [folder] = await createProjectFile({
    projectId: id,
    userId: session.user.id,
    name: parsed.data.name,
    isFolder: true,
    parentId: parsed.data.parentId ?? undefined,
    tags: [],
  });

  return NextResponse.json(folder, { status: 201 });
}
