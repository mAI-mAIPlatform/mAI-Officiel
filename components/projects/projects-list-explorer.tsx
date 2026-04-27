"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "./project-card";

type ProjectItem = {
  id: string;
  name: string;
  instructions: string | null;
  createdAt: string;
  icon: string | null;
  color: string | null;
  tags: string[];
  archivedAt: string | null;
};

export function ProjectsListExplorer({
  projects,
  progressByProject,
}: {
  projects: ProjectItem[];
  progressByProject: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [sortBy, setSortBy] = useState<"created_desc" | "name_asc" | "progress_desc">("created_desc");

  const tags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((project) => (project.tags ?? []).forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    let rows = projects.filter((project) =>
      project.name.toLowerCase().includes(query.toLowerCase())
    );

    if (tagFilter) {
      rows = rows.filter((project) => (project.tags ?? []).includes(tagFilter));
    }

    if (statusFilter === "active") {
      rows = rows.filter((project) => project.archivedAt === null);
    }

    if (statusFilter === "archived") {
      rows = rows.filter((project) => project.archivedAt !== null);
    }

    if (sortBy === "name_asc") {
      rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "progress_desc") {
      rows = [...rows].sort(
        (a, b) => (progressByProject[b.id] ?? 0) - (progressByProject[a.id] ?? 0)
      );
    } else {
      rows = [...rows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return rows;
  }, [projects, progressByProject, query, sortBy, statusFilter, tagFilter]);

  return (
    <section className="space-y-4">
      <div className="grid gap-2 rounded-2xl border border-white/30 bg-white/80 p-3 md:grid-cols-4">
        <input
          className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un projet"
          value={query}
        />
        <select
          className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm"
          onChange={(event) => setTagFilter(event.target.value)}
          value={tagFilter}
        >
          <option value="">Tous les tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <select
          className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm"
          onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "archived")}
          value={statusFilter}
        >
          <option value="all">Tous statuts</option>
          <option value="active">Actifs</option>
          <option value="archived">Archivés</option>
        </select>
        <select
          className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm"
          onChange={(event) =>
            setSortBy(event.target.value as "created_desc" | "name_asc" | "progress_desc")
          }
          value={sortBy}
        >
          <option value="created_desc">Tri: date de création</option>
          <option value="name_asc">Tri: alphabétique</option>
          <option value="progress_desc">Tri: progression</option>
        </select>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>
    </section>
  );
}
