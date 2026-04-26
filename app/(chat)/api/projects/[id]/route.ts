import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteProjectByUser,
  getProjectById,
  updateProjectByUser,
} from "@/lib/db/queries";
import type { Project } from "@/lib/db/schema";
import { requireProjectRole } from "@/lib/projects/permissions";

const DEFAULT_PROJECT_NOTIFICATION_SETTINGS = {
  deadlineReminders: true,
  taskAssignment: true,
  commentAdded: true,
  taskCompleted: true,
};

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(5000).optional(),
  instructions: z.string().trim().max(5000).optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(30).optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  icon: z.string().trim().max(50).nullable().optional(),
  aiModel: z.string().trim().max(120).nullable().optional(),
  systemInstructions: z.string().trim().max(10000).nullable().optional(),
  notificationSettings: z
    .object({
      deadlineReminders: z.boolean().optional(),
      taskAssignment: z.boolean().optional(),
      commentAdded: z.boolean().optional(),
      taskCompleted: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "viewer");
  if (permission.response) {
    return permission.response;
  }
  const item = await getProjectById(id);

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "owner");
  if (permission.response) {
    return permission.response;
  }
  const existing = await getProjectById(id);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { notificationSettings, ...restData } = parsed.data;
  const data: Partial<Project> = { ...restData };

  if (notificationSettings) {
    const mergedSettings = {
      ...DEFAULT_PROJECT_NOTIFICATION_SETTINGS,
      ...(existing.notificationSettings ?? {}),
      ...notificationSettings,
    };

    data.notificationSettings = {
      deadlineReminders: mergedSettings.deadlineReminders,
      taskAssignment: mergedSettings.taskAssignment,
      commentAdded: mergedSettings.commentAdded,
      taskCompleted: mergedSettings.taskCompleted,
    };
  }

  const [updated] = await updateProjectByUser(id, session.user.id, data);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const permission = await requireProjectRole(id, session.user.id, "owner");
  if (permission.response) {
    return permission.response;
  }
  await deleteProjectByUser(id, session.user.id);

  return NextResponse.json({ success: true });
}
