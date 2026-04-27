import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ProjectForm } from "@/components/projects/project-form";
import { getProjectTemplateById } from "@/lib/db/queries";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ templateId?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { templateId } = await searchParams;
  const selectedTemplate = templateId
    ? await getProjectTemplateById(templateId)
    : undefined;

  const canUseTemplate =
    selectedTemplate &&
    (selectedTemplate.userId === session.user.id || selectedTemplate.isPublic);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 text-black md:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Créer un projet</h1>
        <Link className="text-sm text-black/70 underline" href="/projects">
          Retour à la liste
        </Link>
      </div>
      <ProjectForm
        initialValues={
          canUseTemplate
            ? {
                id: "",
                name: selectedTemplate.name,
                description: selectedTemplate.description ?? "",
                instructions: selectedTemplate.defaultInstructions ?? "",
                tags: selectedTemplate.tags ?? [],
                templateId: selectedTemplate.id,
              }
            : undefined
        }
        mode="create"
      />
    </main>
  );
}
