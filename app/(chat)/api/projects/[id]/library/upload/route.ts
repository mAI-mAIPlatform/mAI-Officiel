import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createProjectActivity,
  createProjectFile,
  getLatestProjectFileVersion,
} from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const parentId = (formData.get("parentId") as string | null) ?? undefined;
  const taskId = (formData.get("taskId") as string | null) ?? undefined;
  const importUrl = (formData.get("importUrl") as string | null) ?? null;
  const importName = (formData.get("importName") as string | null) ?? null;

  if (!file && !importUrl) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const resolvedName =
    importName?.trim() ||
    file?.name ||
    importUrl?.split("/").pop()?.split("?")[0] ||
    "fichier-importe";
  const latestVersion = await getLatestProjectFileVersion(id, resolvedName, parentId);

  let blobUrl = importUrl ?? null;
  let mimeType = file?.type ?? null;
  let size = file?.size ?? null;

  if (file) {
    const buffer = await file.arrayBuffer();
    const pathname = `${session.user.id}/projects/${id}/${Date.now()}-${resolvedName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const blob = await put(pathname, buffer, { access: "public" });
    blobUrl = blob.url;
  }

  const [created] = await createProjectFile({
    projectId: id,
    userId: session.user.id,
    name: resolvedName,
    isFolder: false,
    blobUrl: blobUrl ?? undefined,
    mimeType: mimeType ?? undefined,
    size: size ?? undefined,
    parentId,
    taskId,
    tags: latestVersion?.tags ?? [],
    version: (latestVersion?.version ?? 0) + 1,
    previousVersionId: latestVersion?.id ?? undefined,
    sharedWith: latestVersion?.sharedWith ?? [],
  });

  await createProjectActivity({
    projectId: id,
    userId: session.user.id,
    actionType: "file_uploaded",
    targetType: "file",
    targetId: created.id,
    metadata: {
      name: created.name,
      size: created.size,
      version: created.version,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
