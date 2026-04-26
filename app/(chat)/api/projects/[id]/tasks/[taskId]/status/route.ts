import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getProjectById, getTaskById, updateTask } from "@/lib/db/queries";

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
  const project = await getProjectById(id);

  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const [updated] = await updateTask(taskId, { status: parsed.data.status });
  return NextResponse.json(updated);
}
