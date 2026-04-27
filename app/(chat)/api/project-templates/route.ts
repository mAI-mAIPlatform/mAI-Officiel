import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createProjectTemplate,
  getProjectById,
  getProjectTemplatesByUserOrPublic,
  getSubtasksByTaskIds,
  getTasksByProject,
} from "@/lib/db/queries";
import type { ProjectTemplateTaskModel } from "@/lib/db/schema";

const taskModelSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  subtasks: z.array(z.string().trim().min(1).max(180)).max(50),
});

const createTemplateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(5000).optional().nullable(),
  defaultInstructions: z.string().trim().max(5000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(32)).max(30).optional(),
  taskModels: z.array(taskModelSchema).max(200).optional(),
  icon: z.string().trim().max(50).optional().nullable(),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isPublic: z.boolean().optional(),
  projectId: z.string().uuid().optional(),
  includeInstructions: z.boolean().optional(),
  includeTags: z.boolean().optional(),
  includeTaskStructure: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await getProjectTemplatesByUserOrPublic(session.user.id);
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createTemplateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  let tags = payload.tags ?? [];
  let defaultInstructions = payload.defaultInstructions ?? null;
  let taskModels: ProjectTemplateTaskModel[] = payload.taskModels ?? [];

  if (payload.projectId) {
    const sourceProject = await getProjectById(payload.projectId);

    if (!sourceProject || sourceProject.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (payload.includeInstructions) {
      defaultInstructions = sourceProject.instructions ?? null;
    }

    if (payload.includeTags) {
      tags = sourceProject.tags ?? [];
    }

    if (payload.includeTaskStructure) {
      const tasks = await getTasksByProject(payload.projectId);
      const taskIds = tasks.map((task) => task.id);
      const subtasks = await getSubtasksByTaskIds(taskIds);
      const subtasksByTaskId = subtasks.reduce(
        (acc, subtask) => {
          if (!acc[subtask.taskId]) {
            acc[subtask.taskId] = [];
          }
          acc[subtask.taskId].push(subtask.title);
          return acc;
        },
        {} as Record<string, string[]>
      );

      taskModels = tasks.map((task) => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
        subtasks: subtasksByTaskId[task.id] ?? [],
      }));
    }
  }

  const [created] = await createProjectTemplate({
    userId: session.user.id,
    name: payload.name,
    description: payload.description ?? null,
    defaultInstructions,
    tags,
    taskModels,
    icon: payload.icon ?? null,
    color: payload.color ?? null,
    isPublic: payload.isPublic ?? false,
  });

  return NextResponse.json(created, { status: 201 });
}
