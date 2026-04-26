import Link from "next/link";
import { Settings } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import {
  getChatsByProjectId,
  getChatsByUserId,
  getProjectAccess,
  getProjectById,
  getProjectStatsById,
} from "@/lib/db/queries";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const [project, access] = await Promise.all([
    getProjectById(id),
    getProjectAccess(id, session.user.id),
  ]);

  if (!project || !access) {
    notFound();
  }

  const [projectChats, allUserChats, projectStats] = await Promise.all([
    getChatsByProjectId({ projectId: id, userId: session.user.id }),
    getChatsByUserId({
      id: session.user.id,
      limit: 100,
      startingAfter: null,
      endingBefore: null,
    }).then((result) => result.chats),
    getProjectStatsById(id),
  ]);

  const importableChats = allUserChats.filter((chat) => chat.projectId !== id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <section className="liquid-panel rounded-3xl border border-white/30 bg-white/80 p-6 text-black shadow-xl backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-black">
              {project.name}
            </h1>
            <p className="mt-1 text-sm text-black/70">
              Dossier projet : discussions, sources et connaissances
              centralisées.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              aria-label="Paramètres avancés"
              className="rounded-xl border border-black/20 bg-white p-2 text-black"
              href={`/projects/${project.id}/edit`}
              title="Paramètres avancés"
            >
              <Settings className="size-4" />
            </Link>
            <Link
              className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-medium text-black"
              href={`/projects/${project.id}/edit`}
            >
              Paramètres projet
            </Link>
            <Link
              className="rounded-xl border border-cyan-500/30 bg-cyan-200/70 px-3 py-2 text-sm font-medium text-black"
              href={`/?projectId=${project.id}`}
            >
              Nouvelle discussion projet
            </Link>
          </div>
        </div>
      </section>

      <ProjectWorkspace
        importableChats={importableChats.map((chat) => ({
          id: chat.id,
          title: chat.title,
        }))}
        projectChats={projectChats.map((chat) => ({
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt.toISOString(),
        }))}
        projectId={project.id}
        projectInstructions={project.instructions ?? ""}
        projectName={project.name}
        projectStartDate={project.startDate?.toISOString() ?? null}
        projectEndDate={project.endDate?.toISOString() ?? null}
        projectTags={project.tags ?? []}
        projectColor={project.color ?? null}
        stats={{
          totalTasks: projectStats.totalTasks,
          completedTasks: projectStats.completedTasks,
          inProgressTasks: projectStats.inProgressTasks,
          todoTasks: projectStats.todoTasks,
          progressPercentage: projectStats.progressPercentage,
          totalChats: projectStats.totalChats,
          daysRemaining: projectStats.daysRemaining,
          totalSubtasks: projectStats.totalSubtasks,
          completedSubtasks: projectStats.completedSubtasks,
        }}
      />
    </main>
  );
}
