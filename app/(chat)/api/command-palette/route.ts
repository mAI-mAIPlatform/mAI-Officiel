import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getProjectFiles, getProjects, getTasksByProject } from "@/lib/db/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await getProjects(session.user.id);
  const tasksNested = await Promise.all(projects.map((project) => getTasksByProject(project.id)));
  const filesNested = await Promise.all(projects.map((project) => getProjectFiles(project.id)));

  const tasks = tasksNested.flatMap((items, index) =>
    items.map((task) => ({
      id: task.id,
      title: task.title,
      projectId: projects[index]?.id,
      projectName: projects[index]?.name,
    }))
  );

  const files = filesNested.flatMap((items, index) =>
    items
      .filter((file) => !file.isFolder)
      .map((file) => ({
        id: file.id,
        name: file.name,
        projectId: projects[index]?.id,
        projectName: projects[index]?.name,
      }))
  );

  return NextResponse.json({
    projects: projects.map((project) => ({ id: project.id, name: project.name })),
    tasks,
    files,
  });
}
