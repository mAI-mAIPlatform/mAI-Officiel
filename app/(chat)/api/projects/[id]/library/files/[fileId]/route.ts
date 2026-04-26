import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteProjectFile,
  getProjectFiles,
  updateProjectFile,
} from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  parentId: z.string().uuid().nullable().optional(),
  taskId: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "editor");
  if (permission.response) {
    return permission.response;
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await updateProjectFile(fileId, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "editor");
  if (permission.response) {
    return permission.response;
  }

  const files = await getProjectFiles(id);
  const idsToDelete = new Set<string>([fileId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of files) {
      if (item.parentId && idsToDelete.has(item.parentId) && !idsToDelete.has(item.id)) {
        idsToDelete.add(item.id);
        changed = true;
      }
    }
  }

  for (const targetId of idsToDelete) {
    await deleteProjectFile(targetId);
  }

  return NextResponse.json({ success: true });
}
