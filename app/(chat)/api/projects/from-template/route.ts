import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createProject,
  createSubtask,
  createTask,
  getProjectTemplateById,
} from "@/lib/db/queries";

const createFromTemplateSchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  instructions: z.string().trim().max(5000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(32)).max(30).optional(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createFromTemplateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const template = await getProjectTemplateById(parsed.data.templateId);

  if (
    !template ||
    (template.userId !== session.user.id && template.isPublic !== true)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [project] = await createProject({
    userId: session.user.id,
    name: parsed.data.name ?? template.name,
    description: parsed.data.description ?? template.description,
    instructions: parsed.data.instructions ?? template.defaultInstructions,
    tags: parsed.data.tags ?? template.tags ?? [],
    color: template.color,
    icon: template.icon,
    templateId: template.id,
  });

  const taskModels = template.taskModels ?? [];

  for (const model of taskModels) {
    const [createdTask] = await createTask({
      projectId: project.id,
      title: model.title,
      description: model.description ?? null,
      priority: model.priority ?? "medium",
    });

    for (const subtaskTitle of model.subtasks ?? []) {
      await createSubtask({
        taskId: createdTask.id,
        title: subtaskTitle,
      });
    }
  }

  return NextResponse.json(project, { status: 201 });
}
