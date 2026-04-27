import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ProjectsDashboardWidgets } from "@/components/projects/projects-dashboard-widgets";
import { ProjectsListExplorer } from "@/components/projects/projects-list-explorer";
import { ProjectTemplateGallery } from "@/components/projects/project-template-gallery";
import { getProjects, getProjectsProgressByIds } from "@/lib/db/queries";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const projects = await getProjects(session.user.id);
  const progressByProject = await getProjectsProgressByIds(
    projects.map((project) => project.id)
  );

  const projectsWithInstructions = projects.filter(
    (project) => (project.instructions ?? "").trim().length > 0
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 text-black md:px-6">
      <section className="liquid-panel rounded-3xl border border-white/30 bg-white/80 p-6 text-black backdrop-blur-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Projets</h1>
            <p className="text-sm text-black/70">
              Isolez conversations, sources, mémoire et tâches par contexte.
            </p>
            <p className="mt-1 text-xs text-black/60">
              {projects.length} projets • {projectsWithInstructions} avec instructions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ProjectTemplateGallery userId={session.user.id} />
            <Link
              className="flex min-h-11 items-center rounded-xl border border-cyan-400/40 bg-cyan-200/70 px-4 py-2 text-sm font-medium text-black"
              href="/projects/new"
            >
              Nouveau projet
            </Link>
          </div>
        </div>
      </section>

      <ProjectsDashboardWidgets projects={projects} userId={session.user.id} />

      {projects.length === 0 ? (
        <section className="liquid-panel rounded-2xl border border-white/30 bg-white/80 p-8 text-sm text-black/75 backdrop-blur-2xl">
          Aucun projet pour le moment. Créez votre premier projet pour
          structurer vos données.
        </section>
      ) : (
        <ProjectsListExplorer
          progressByProject={progressByProject}
          projects={projects.map((project) => ({
            id: project.id,
            name: project.name,
            instructions: project.instructions,
            createdAt: project.createdAt.toISOString(),
            icon: project.icon,
            color: project.color,
            tags: project.tags ?? [],
            archivedAt: project.archivedAt?.toISOString() ?? null,
          }))}
        />
      )}
    </main>
  );
}
