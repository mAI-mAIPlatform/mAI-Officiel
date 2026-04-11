import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { computeNextDueDate } from "@/lib/tasks";
import {
  createTask,
  deleteTask,
  getProjectById,
  getTaskById,
  updateTask,
} from "@/lib/db/queries";

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
});

async function assertOwnership(projectId: string, userId: string) {
  const project = await getProjectById(projectId);
  return project && project.userId === userId;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId } = await context.params;
  const isOwner = await assertOwnership(id, session.user.id);

  if (!isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const task = await getTaskById(taskId);
  if (!task || task.projectId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = await request.json();
  const parsed = updateTaskSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await updateTask(taskId, {
    title: parsed.data.title,
    description: parsed.data.description ?? undefined,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    status: parsed.data.status,
    priority: parsed.data.priority,
    repeatType: parsed.data.repeatType,
    repeatInterval: parsed.data.repeatInterval ?? undefined,
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
  const isOwner = await assertOwnership(id, session.user.id);

  if (!isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const task = await getTaskById(taskId);
  if (!task || task.projectId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteTask(taskId);
  return NextResponse.json({ success: true });
}
