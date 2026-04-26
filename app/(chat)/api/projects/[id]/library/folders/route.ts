import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createProjectFile, getProjectById } from "@/lib/db/queries";

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
  const project = await getProjectById(id);
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
