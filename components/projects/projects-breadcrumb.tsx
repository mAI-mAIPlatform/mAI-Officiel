"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

function getSectionLabel(tab: string | null, pathname: string) {
  if (pathname.endsWith("/edit")) return "Paramètres";
  if (pathname.endsWith("/new")) return "Nouveau";
  if (tab === "tasks") return "Tâches";
  if (tab === "library") return "Bibliothèque";
  if (tab === "history") return "Historique";
  if (tab === "activity") return "Activité";
  return "Aperçu";
}

export function ProjectsBreadcrumb() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const projectId = projectMatch?.[1] ?? null;

  const { data: project } = useSWR<{ name: string }>(
    projectId && projectId !== "new" && projectId !== "invitations"
      ? `/api/projects/${projectId}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!pathname.startsWith("/projects")) {
    return null;
  }

  const activeTab = searchParams?.get("tab") ?? null;
  const section = getSectionLabel(activeTab, pathname);
  const mobileCurrent = project?.name ?? (pathname === "/projects" ? "Projets" : section);

  return (
    <nav className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-6" aria-label="Fil d'ariane">
      <div className="hidden items-center gap-2 text-sm text-black/70 md:flex">
        <Link className="hover:text-black" href="/projects">Projets</Link>
        {projectId && project ? (
          <>
            <ChevronRight className="size-4" />
            <Link className="hover:text-black" href={`/projects/${projectId}`}>{project.name}</Link>
            <ChevronRight className="size-4" />
            <span className="text-black">{section}</span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-sm text-black md:hidden">
        <button className="rounded-lg border border-black/20 bg-white px-2 py-1" onClick={() => history.back()} type="button">
          <ChevronLeft className="size-4" />
        </button>
        <span className="truncate font-medium">{mobileCurrent}</span>
      </div>
    </nav>
  );
}
