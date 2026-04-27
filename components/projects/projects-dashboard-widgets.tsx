import Link from "next/link";
import {
  getGlobalProgressForUser,
  getRecentActivityForUser,
  getUrgentTasksForUser,
} from "@/lib/db/queries";
import type { Project } from "@/lib/db/schema";

export async function ProjectsDashboardWidgets({
  userId,
  projects,
}: {
  userId: string;
  projects: Project[];
}) {
  const [urgentTasks, globalProgress, activity] = await Promise.all([
    getUrgentTasksForUser(userId, 5),
    getGlobalProgressForUser(userId),
    getRecentActivityForUser(userId, 6),
  ]);

  const pinned = projects.filter((project) => project.pinned).slice(0, 5);
  const recent = [...projects]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold text-black">Tâches urgentes</h2>
        <div className="mt-2 space-y-2">
          {urgentTasks.length === 0 ? (
            <p className="text-xs text-black/60">Aucune tâche urgente.</p>
          ) : (
            urgentTasks.map((task) => (
              <Link
                className="block min-h-11 rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-sm"
                href={`/projects/${task.projectId}`}
                key={task.id}
              >
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-black/60">
                  {task.projectName} • {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                </p>
              </Link>
            ))
          )}
        </div>
      </article>

      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold text-black">Progression globale</h2>
        <p className="mt-1 text-xs text-black/60">Moyenne des projets actifs</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-cyan-400" style={{ width: `${globalProgress}%` }} />
        </div>
        <p className="mt-2 text-sm font-medium text-black">{globalProgress}%</p>
      </article>

      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold text-black">Activité récente</h2>
        <div className="mt-2 space-y-2">
          {activity.length === 0 ? (
            <p className="text-xs text-black/60">Aucune activité récente.</p>
          ) : (
            activity.map((item) => (
              <div className="min-h-11 rounded-lg border border-black/10 bg-white/80 px-3 py-2" key={item.id}>
                <p className="text-xs font-medium text-black">{item.projectName}</p>
                <p className="text-sm text-black/80">{item.label}</p>
              </div>
            ))
          )}
        </div>
      </article>

      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold text-black">Projets favoris</h2>
        <p className="mt-1 text-xs text-black/60">Épinglés et récemment consultés</p>
        <div className="mt-2 space-y-2">
          {[...pinned, ...recent.filter((p) => !pinned.find((pp) => pp.id === p.id))]
            .slice(0, 6)
            .map((project) => (
              <Link
                className="flex min-h-11 items-center rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-sm"
                href={`/projects/${project.id}`}
                key={project.id}
              >
                {project.name}
              </Link>
            ))}
        </div>
      </article>
    </section>
  );
}
