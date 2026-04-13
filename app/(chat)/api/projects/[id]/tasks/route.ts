import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createTask,
  getProjectById,
  getSubtasksByTaskIds,
  getSubtasksByTask,
  getTasksByProject,
} from "@/lib/db/queries";

const taskSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  repeatType: z
    .enum(["none", "daily", "weekly", "monthly", "custom"])
    .optional(),
  repeatInterval: z.number().int().positive().optional().nullable(),
});

const querySchema = z.object({
  sortBy: z.enum(["dueDate", "priority", "status"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

const priorityValue = { low: 0, medium: 1, high: 2 } as const;
const statusValue = { todo: 0, doing: 1, done: 2 } as const;

export async function GET(
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

  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsedQuery = querySchema.safeParse(query);

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: parsedQuery.error.flatten() },
      { status: 400 }
    );
  }

  const tasks = await getTasksByProject(id);
  const taskIds = tasks.map((task) => task.id);
  const allSubtasks = await getSubtasksByTaskIds(taskIds);

  const subtasksByTaskId = allSubtasks.reduce((acc, subtask) => {
    if (!acc[subtask.taskId]) {
      acc[subtask.taskId] = [];
    }
    acc[subtask.taskId].push(subtask);
    return acc;
  }, {} as Record<string, typeof allSubtasks>);

  const tasksWithSubtasks = tasks.map((task) => {
    const subtasks = subtasksByTaskId[task.id] || [];
    const completedSubtasks = subtasks.filter((subtask) => subtask.status === "done").length;

    return {
      ...task,
      isOverdue:
        task.dueDate !== null && task.status !== "done"
          ? task.dueDate.getTime() < Date.now()
          : false,
      progression:
        subtasks.length > 0
          ? completedSubtasks / subtasks.length
          : task.status === "done"
            ? 1
            : 0,
      subtasks,
    };
  });

  const sorted = [...tasksWithSubtasks];

  if (parsedQuery.data.sortBy === "priority") {
    sorted.sort((a, b) => priorityValue[a.priority] - priorityValue[b.priority]);
  } else if (parsedQuery.data.sortBy === "status") {
    sorted.sort((a, b) => statusValue[a.status] - statusValue[b.status]);
  } else {
    sorted.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }

  if (parsedQuery.data.order === "desc") {
    sorted.reverse();
  }

  return NextResponse.json(sorted);
}

export async function POST(
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

  const parsed = taskSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [created] = await createTask({
    projectId: id,
    title: parsed.data.title,
    description: parsed.data.description,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    repeatType: parsed.data.repeatType,
    repeatInterval: parsed.data.repeatInterval,
  });

  return NextResponse.json(created, { status: 201 });
}
