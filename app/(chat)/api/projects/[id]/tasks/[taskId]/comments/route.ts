import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createTaskComment,
  getProjectById,
  getTaskById,
  getTaskCommentsByTaskId,
} from "@/lib/db/queries";

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  isAiGenerated: z.boolean().optional(),
});

async function assertOwnership(projectId: string, userId: string) {
  const project = await getProjectById(projectId);
  return project && project.userId === userId;
}

export async function GET(
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
  const isOwner = await assertOwnership(id, session.user.id);

  if (!isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  return NextResponse.json(created, { status: 201 });
}
