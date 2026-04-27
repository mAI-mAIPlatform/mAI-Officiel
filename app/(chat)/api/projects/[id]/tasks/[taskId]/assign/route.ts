import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getProjectById,
  getTaskById,
  updateTask,
  db,
} from "@/lib/db/queries";
import { eq } from "drizzle-orm";
import { user } from "@/lib/db/schema";

const assignSchema = z.object({
  assigneeType: z.enum(["user", "ai"]),
  assigneeId: z.string().uuid().nullable().optional(),
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

  const parsed = assignSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let assigneeId: string | null = parsed.data.assigneeId ?? null;

  if (parsed.data.assigneeType === "user" && assigneeId) {
    const [targetUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, assigneeId));

    if (!targetUser) {
      return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
    }
  }

  if (parsed.data.assigneeType === "ai") {
    assigneeId = null;
  }

  const [updated] = await updateTask(taskId, {
    assigneeType: parsed.data.assigneeType,
    assigneeId,
  });

  return NextResponse.json(updated);
}
