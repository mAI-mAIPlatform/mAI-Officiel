import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createProjectActivity,
  createTask,
  deleteTask,
  getTaskById,
  updateTask,
} from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";
import { computeNextDueDate } from "@/lib/tasks";

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  repeatType: z
    .enum(["none", "daily", "weekly", "monthly", "custom"])
    .optional(),
  repeatInterval: z.number().int().positive().optional().nullable(),
  assigneeType: z.enum(["user", "ai"]).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function PUT(
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

  const payload = await request.json();
  const parsed = updateTaskSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await updateTask(taskId, {
    title: parsed.data.title,
    description: parsed.data.description ?? undefined,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    status: parsed.data.status,
    priority: parsed.data.priority,
    repeatType: parsed.data.repeatType,
    repeatInterval: parsed.data.repeatInterval ?? undefined,
    assigneeType: parsed.data.assigneeType,
    assigneeId: parsed.data.assigneeId,
    sortOrder: parsed.data.sortOrder,
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    task.repeatType !== "none" &&
    parsed.data.status === "done" &&
    task.dueDate !== null
  ) {
    const nextDueDate = computeNextDueDate(
      task.dueDate,
      task.repeatType,
      task.repeatInterval
    );

    if (nextDueDate) {
      await createTask({
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        dueDate: nextDueDate,
        priority: task.priority,
        repeatType: task.repeatType,
        repeatInterval: task.repeatInterval,
      });
    }
  }

  await createProjectActivity({
    projectId: id,
    userId: session.user.id,
    actionType: parsed.data.status === "done" ? "task_completed" : "task_updated",
    targetType: "task",
    targetId: taskId,
    metadata: {
      title: updated.title,
      previousStatus: task.status,
      newStatus: updated.status,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
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

  await deleteTask(taskId);
  await createProjectActivity({
    projectId: id,
    userId: session.user.id,
    actionType: "task_deleted",
    targetType: "task",
    targetId: taskId,
    metadata: {
      title: task.title,
    },
  });
  return NextResponse.json({ success: true });
}
