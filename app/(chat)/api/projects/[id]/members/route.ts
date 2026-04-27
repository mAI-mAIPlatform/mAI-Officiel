import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createProjectActivity,
  createProjectInvitation,
  deleteProjectInvitation,
  listProjectInvitations,
  listProjectMembers,
  removeProjectMember,
  updateProjectMemberRole,
} from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

const inviteSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(["editor", "viewer"]).default("viewer"),
});

const updateRoleSchema = z.object({
  memberUserId: z.string().uuid(),
  role: z.enum(["editor", "viewer"]),
});

const deleteMemberSchema = z.object({
  memberUserId: z.string().uuid().optional(),
  invitationId: z.string().uuid().optional(),
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

  const [members, invitations] = await Promise.all([
    listProjectMembers(id),
    listProjectInvitations(id),
  ]);

  return NextResponse.json({ members, invitations });
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
  const permission = await requireProjectRole(id, session.user.id, "owner");

  if (permission.response) {
    return permission.response;
  }

  const payload = await request.json();
  const parsed = inviteSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const [invitation] = await createProjectInvitation({
    projectId: id,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await createProjectActivity({
    projectId: id,
    userId: session.user.id,
    actionType: "member_invited",
    targetType: "member",
    metadata: {
      email: invitation.email,
      role: invitation.role,
    },
  });

  return NextResponse.json(
    {
      invitation,
      inviteLink: `${new URL(request.url).origin}/projects/invitations/${token}`,
    },
    { status: 201 }
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

  const payload = await request.json();
  const parsed = updateRoleSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await updateProjectMemberRole(
    id,
    parsed.data.memberUserId,
    parsed.data.role
  );

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
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

  const payload = await request.json();
  const parsed = deleteMemberSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.invitationId) {
    await deleteProjectInvitation(id, parsed.data.invitationId);
    return NextResponse.json({ success: true });
  }

  if (!parsed.data.memberUserId) {
    return NextResponse.json({ error: "memberUserId requis" }, { status: 400 });
  }

  await removeProjectMember(id, parsed.data.memberUserId);
  await createProjectActivity({
    projectId: id,
    userId: session.user.id,
    actionType: "member_removed",
    targetType: "member",
    targetId: parsed.data.memberUserId,
    metadata: {
      removedUserId: parsed.data.memberUserId,
    },
  });
  return NextResponse.json({ success: true });
}
