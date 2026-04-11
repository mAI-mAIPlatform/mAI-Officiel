import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteSubtask,
  getProjectById,
  getSubtasksByTask,
  getTaskById,
  updateSubtask,
} from "@/lib/db/queries";

const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  status: z.enum(["todo", "done"]).optional(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; taskId: string; subtaskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId, subtaskId } = await context.params;
  const project = await getProjectById(id);
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const task = await getTaskById(taskId);
  if (!task || task.projectId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const subtasks = await getSubtasksByTask(taskId);
  const targetSubtask = subtasks.find((subtask) => subtask.id === subtaskId);
  if (!targetSubtask) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = updateSubtaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await updateSubtask(subtaskId, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; taskId: string; subtaskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId, subtaskId } = await context.params;
  const project = await getProjectById(id);
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const task = await getTaskById(taskId);
  if (!task || task.projectId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const subtasks = await getSubtasksByTask(taskId);
  const targetSubtask = subtasks.find((subtask) => subtask.id === subtaskId);
  if (!targetSubtask) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteSubtask(subtaskId);
  return NextResponse.json({ success: true });
}
