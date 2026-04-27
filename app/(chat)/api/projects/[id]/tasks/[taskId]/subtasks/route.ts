import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createSubtask, getProjectById, getTaskById } from "@/lib/db/queries";

const subtaskSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(["todo", "done"]).optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(
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

  const parsed = subtaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [created] = await createSubtask({
    taskId,
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    sortOrder: parsed.data.sortOrder,
  });

  return NextResponse.json(created, { status: 201 });
}
