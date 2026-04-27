import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getProjectActivities } from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

const querySchema = z.object({
  actionType: z
    .enum([
      "task_created",
      "task_updated",
      "task_completed",
      "task_deleted",
      "comment_added",
      "file_uploaded",
      "file_deleted",
      "member_invited",
      "member_removed",
      "project_updated",
      "source_added",
    ])
    .optional(),
  userId: z.string().uuid().optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(
  request: Request,
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

  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = querySchema.safeParse(query);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getProjectActivities(id, parsed.data);
  return NextResponse.json(result);
}
