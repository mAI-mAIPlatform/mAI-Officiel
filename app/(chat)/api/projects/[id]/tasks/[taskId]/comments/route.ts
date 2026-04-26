import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createProjectActivity,
  createTaskComment,
  getTaskById,
  getTaskCommentsByTaskId,
} from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  isAiGenerated: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "viewer");
  if (permission.response) {
    return permission.response;
  }

  const task = await getTaskById(taskId);
  if (!task || task.projectId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comments = await getTaskCommentsByTaskId(taskId);
  return NextResponse.json(comments);
}

export async function POST(
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

  const parsed = createCommentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [created] = await createTaskComment({
    taskId,
    authorId: session.user.id,
    content: parsed.data.content,
    isAiGenerated: parsed.data.isAiGenerated ?? false,
  });

  await createProjectActivity({
    projectId: id,
    userId: session.user.id,
    actionType: "comment_added",
    targetType: "comment",
    targetId: created.id,
    metadata: {
      taskId,
      taskTitle: task.title,
      preview: created.content.slice(0, 180),
    },
  });

  return NextResponse.json(created, { status: 201 });
}
