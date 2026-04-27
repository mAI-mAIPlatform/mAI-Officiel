import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getProjectNotificationPreference,
  upsertProjectNotificationPreference,
} from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

const updateSchema = z.object({
  deadlineReminders: z.boolean().optional(),
  taskAssignment: z.boolean().optional(),
  commentAdded: z.boolean().optional(),
  taskCompleted: z.boolean().optional(),
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
  const permission = await requireProjectRole(id, session.user.id, "owner");
  if (permission.response) {
    return permission.response;
  }

  const pref = await getProjectNotificationPreference(id, session.user.id);

  return NextResponse.json(
    pref ?? {
      deadlineReminders: true,
      taskAssignment: true,
      commentAdded: true,
      taskCompleted: true,
    }
  );
}

export async function PATCH(
  request: Request,
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

  const parsed = updateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await upsertProjectNotificationPreference(
    id,
    session.user.id,
    parsed.data
  );

  return NextResponse.json(updated);
}
