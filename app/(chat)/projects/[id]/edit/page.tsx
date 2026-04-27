import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ProjectAdvancedSettings } from "@/components/projects/project-advanced-settings";
import { ProjectMembersManager } from "@/components/projects/project-members-manager";
import { getProjectAccess, getProjectById } from "@/lib/db/queries";

export default async function EditProjectPage({
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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 text-black md:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Paramètres avancés du projet</h1>
        <Link className="text-sm text-black/70 underline" href="/projects">
          Retour à la liste
        </Link>
      </div>
      <ProjectAdvancedSettings
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
          instructions: project.instructions,
          tags: project.tags ?? [],
          aiModel: project.aiModel ?? null,
          systemInstructions: project.systemInstructions ?? null,
          notificationSettings: project.notificationSettings ?? null,
          icon: project.icon ?? null,
          color: project.color ?? null,
        }}
      />
      <ProjectMembersManager currentUserRole={access.role} projectId={project.id} />
    </main>
  );
}
