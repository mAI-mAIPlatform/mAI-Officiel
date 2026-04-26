import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createProjectFile, getProjectById } from "@/lib/db/queries";

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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const parentId = (formData.get("parentId") as string | null) ?? undefined;
  const taskId = (formData.get("taskId") as string | null) ?? undefined;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const pathname = `${session.user.id}/projects/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const blob = await put(pathname, buffer, { access: "public" });

  const [created] = await createProjectFile({
    projectId: id,
    userId: session.user.id,
    name: file.name,
    isFolder: false,
    blobUrl: blob.url,
    mimeType: file.type,
    size: file.size,
    parentId,
    taskId,
    tags: [],
  });

  return NextResponse.json(created, { status: 201 });
}
