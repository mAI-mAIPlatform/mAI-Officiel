import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getProjectFiles, getTasksByProject } from "@/lib/db/queries";
import { requireProjectRole } from "@/lib/projects/permissions";

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

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  const [tasks, files] = await Promise.all([
    getTasksByProject(id),
    getProjectFiles(id),
  ]);

  const taskItems = tasks
    .filter((task) => task.title.toLowerCase().includes(query))
    .slice(0, 8)
    .map((task) => ({
      id: task.id,
      label: `@tâche ${task.title}`,
      type: "task" as const,
    }));

  const fileItems = files
    .filter((file) => !file.isFolder)
    .filter((file) => file.name.toLowerCase().includes(query))
    .slice(0, 8)
    .map((file) => ({
      id: file.id,
      label: `@fichier ${file.name}`,
      type: "file" as const,
    }));

  return NextResponse.json([...taskItems, ...fileItems]);
}
