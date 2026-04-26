import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createProjectActivity,
  getTaskById,
  updateTask,
} from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

const updateStatusSchema = z.object({
  status: z.enum(["todo", "doing", "done"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "editor");
  if (permission.response) {
    return permission.response;
  }

  const task = await getTaskById(taskId);
  if (!task || task.projectId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = updateStatusSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const previousStatus = task.status;
  const [updated] = await updateTask(taskId, { status: parsed.data.status });
  await createProjectActivity({
    projectId: id,
    userId: session.user.id,
    actionType:
      parsed.data.status === "done" ? "task_completed" : "task_updated",
    targetType: "task",
    targetId: taskId,
    metadata: {
      title: task.title,
      previousStatus,
      newStatus: parsed.data.status,
    },
  });
  return NextResponse.json(updated);
}
