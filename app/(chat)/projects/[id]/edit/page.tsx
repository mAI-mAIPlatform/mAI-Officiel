import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectNotificationSettings } from "@/components/projects/project-notification-settings";
import { getProjectById } from "@/lib/db/queries";

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
  const project = await getProjectById(id);

  if (!project || project.userId !== session.user.id) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 text-black md:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Éditer le projet</h1>
        <Link className="text-sm text-black/70 underline" href="/projects">
          Retour à la liste
        </Link>
      </div>
      <ProjectForm
        initialValues={{
          id: project.id,
          name: project.name,
          description: project.description,
          instructions: project.instructions,
          tags: project.tags ?? [],
        }}
        mode="edit"
      />
      <ProjectNotificationSettings projectId={project.id} />
    </main>
  );
}
