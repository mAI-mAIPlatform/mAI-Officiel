import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getProjectById, getTaskById, updateTask } from "@/lib/db/queries";

const reorderSchema = z.object({
  status: z.enum(["todo", "doing", "done"]),
  taskIds: z.array(z.string().uuid()).min(1),
});

export async function PATCH(
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

  const parsed = reorderSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  for (const [index, taskId] of parsed.data.taskIds.entries()) {
    const task = await getTaskById(taskId);

    if (!task || task.projectId !== id) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    await updateTask(taskId, {
      status: parsed.data.status,
      sortOrder: index,
    });
  }

  return NextResponse.json({ success: true });
}
