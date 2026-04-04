import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createProject, getProjectsByUser } from "@/lib/db/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await getProjectsByUser(session.user.id);
    return NextResponse.json(projects);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const newProject = await createProject({
      ...data,
      userId: session.user.id,
    });
    return NextResponse.json(newProject[0]);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
