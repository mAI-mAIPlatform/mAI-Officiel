import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createProjectMember,
  deleteProjectInvitationByToken,
  getProjectById,
  getProjectInvitationByToken,
} from "@/lib/db/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const invitation = await getProjectInvitationByToken(token);

  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation expirée" }, { status: 410 });
  }

  const project = await getProjectById(invitation.projectId);
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    project: { id: project.id, name: project.name },
    invitation: {
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    },
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const session = await auth();

  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await context.params;
  const invitation = await getProjectInvitationByToken(token);

  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation expirée" }, { status: 410 });
  }

  if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "Cette invitation ne vous est pas destinée" }, { status: 403 });
  }

  await createProjectMember({
    projectId: invitation.projectId,
    userId: session.user.id,
    role: invitation.role,
    acceptedAt: new Date(),
  });

  await deleteProjectInvitationByToken(token);

  return NextResponse.json({ success: true, projectId: invitation.projectId });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  await deleteProjectInvitationByToken(token);
  return NextResponse.json({ success: true });
}
