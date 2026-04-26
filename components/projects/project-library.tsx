"use client";

import {
  Copy,
  File,
  FileCode,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type FileItem = {
  id: string;
  name: string;
  blobUrl: string | null;
  mimeType: string | null;
  size: number | null;
  parentId: string | null;
  isFolder: boolean;
  tags: string[];
  taskId: string | null;
  createdAt: string;
};

type WebSource = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
};

export function ProjectLibrary({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<FileItem | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterTag, setFilterTag] = useState("");
  const [query, setQuery] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");

  const load = async () => {
    const [filesResponse, webResponse] = await Promise.all([
      fetch(`/api/projects/${projectId}/library/files`),
      fetch(`/api/projects/${projectId}/library/web-sources`),
    ]);

    if (filesResponse.ok) {
      setFiles((await filesResponse.json()) as FileItem[]);
    }

    if (webResponse.ok) {
      setWebSources((await webResponse.json()) as WebSource[]);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    for (const file of files) {
      for (const tag of file.tags ?? []) {
        tags.add(tag);
      }
    }
    return Array.from(tags);
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const nameOk = file.name.toLowerCase().includes(query.toLowerCase());
      const typeOk =
        filterType === "all"
          ? true
          : filterType === "folder"
            ? file.isFolder
            : (file.mimeType ?? "").includes(filterType);
      const tagOk = !filterTag ? true : (file.tags ?? []).includes(filterTag);
      return nameOk && typeOk && tagOk;
    });
  }, [files, filterTag, filterType, query]);

  const byParent = useMemo(() => {
    return filteredFiles.reduce(
      (acc, file) => {
        const key = file.parentId ?? "root";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(file);
        return acc;
      },
      {} as Record<string, FileItem[]>
    );
  }, [filteredFiles]);

  const uploadFiles = async (pickedFiles: FileList | null) => {
    if (!pickedFiles) return;

    for (const file of Array.from(pickedFiles)) {
      const formData = new FormData();
      formData.append("file", file);

      await fetch(`/api/projects/${projectId}/library/upload`, {
        method: "POST",
        body: formData,
      });
    }

    await load();
  };

  const createFolder = async () => {
    const name = window.prompt("Nom du dossier")?.trim();
    if (!name) return;

    await fetch(`/api/projects/${projectId}/library/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    await load();
  };

  const addWebSource = async () => {
    if (!newSourceUrl.trim()) return;

    await fetch(`/api/projects/${projectId}/library/web-sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: newSourceUrl.trim() }),
    });

    setNewSourceUrl("");
    await load();
  };

  const removeFile = async (fileId: string) => {
    await fetch(`/api/projects/${projectId}/library/files/${fileId}`, {
      method: "DELETE",
    });
    await load();
  };

  const renameFile = async (file: FileItem) => {
    const name = window.prompt("Nouveau nom", file.name)?.trim();
    if (!name || name === file.name) return;

    await fetch(`/api/projects/${projectId}/library/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await load();
  };

  const moveFile = async (file: FileItem) => {
    const folderId = window.prompt("ID du dossier parent (laisser vide pour racine)", file.parentId ?? "") ?? "";

    await fetch(`/api/projects/${projectId}/library/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId: folderId.trim() || null }),
    });
    await load();
  };

  const linkToTask = async (file: FileItem) => {
    const taskId = window.prompt("ID de la tâche à lier", file.taskId ?? "") ?? "";

    await fetch(`/api/projects/${projectId}/library/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: taskId.trim() || null }),
    });

    await load();
  };

  const copyLink = async (file: FileItem) => {
    if (!file.blobUrl) return;
    await navigator.clipboard.writeText(file.blobUrl);
  };

  const renderPreview = () => {
    if (!selected) {
      return <p className="text-sm text-black/55">Sélectionnez un fichier pour afficher sa prévisualisation.</p>;
    }

    if (selected.isFolder) {
      return <p className="text-sm text-black/55">Dossier sélectionné : {selected.name}</p>;
    }

    if ((selected.mimeType ?? "").startsWith("image/")) {
      return <img alt={selected.name} className="max-h-64 rounded-lg border border-black/10 object-contain" src={selected.blobUrl ?? ""} />;
    }

    if (selected.mimeType === "application/pdf") {
      return <iframe className="h-72 w-full rounded-lg border border-black/10" src={selected.blobUrl ?? ""} title={selected.name} />;
    }

    if ((selected.mimeType ?? "").startsWith("text/") || (selected.mimeType ?? "").includes("json")) {
      return (
        <div className="rounded-lg border border-black/10 bg-black/90 p-3 text-xs text-white">
          Prévisualisation texte indisponible côté client. Ouvrez le lien du blob pour voir le contenu.
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-black/10 bg-white/75 p-3 text-xs text-black/70">
        Fichier {selected.mimeType ?? "inconnu"} • {(selected.size ?? 0).toLocaleString("fr-FR")} octets
      </div>
    );
  };

  const renderIcon = (file: FileItem) => {
    if (file.isFolder) {
      return expandedFolders[file.id] ? (
        <FolderOpen className="size-4 text-cyan-700" />
      ) : (
        <Folder className="size-4 text-cyan-700" />
      );
    }

    if ((file.mimeType ?? "").startsWith("image/")) {
      return <FileImage className="size-4 text-emerald-700" />;
    }

    if ((file.mimeType ?? "").startsWith("text/")) {
      return <FileText className="size-4 text-indigo-700" />;
    }

    if ((file.mimeType ?? "").includes("json") || (file.mimeType ?? "").includes("javascript")) {
      return <FileCode className="size-4 text-orange-700" />;
    }

    return <File className="size-4 text-black/60" />;
  };

  const renderNode = (parentId: string | null, depth = 0): React.ReactNode => {
    const nodes = byParent[parentId ?? "root"] ?? [];
    return nodes.map((file) => {
      const children = byParent[file.id] ?? [];
      const expanded = expandedFolders[file.id] ?? false;

      return (
        <div key={file.id}>
          <div className="group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/70" style={{ marginLeft: `${depth * 16}px` }}>
            <button
              className="flex items-center gap-2 text-sm"
              onClick={() => {
                if (file.isFolder) {
                  setExpandedFolders((prev) => ({ ...prev, [file.id]: !expanded }));
                }
                setSelected(file);
              }}
              type="button"
            >
              {renderIcon(file)}
              <span>{file.name}</span>
            </button>

            <div className="ml-auto hidden items-center gap-1 group-hover:flex">
              <button className="rounded border border-black/10 p-1" onClick={() => renameFile(file)} type="button">R</button>
              <button className="rounded border border-black/10 p-1" onClick={() => moveFile(file)} type="button">M</button>
              <button className="rounded border border-black/10 p-1" onClick={() => linkToTask(file)} type="button">T</button>
              <button className="rounded border border-black/10 p-1" onClick={() => copyLink(file)} type="button"><Copy className="size-3" /></button>
              <button className="rounded border border-black/10 p-1 text-red-700" onClick={() => removeFile(file.id)} type="button"><Trash2 className="size-3" /></button>
            </div>
          </div>

          {file.isFolder && expanded && children.length > 0 ? renderNode(file.id, depth + 1) : null}
        </div>
      );
    });
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
        <article className="liquid-panel rounded-2xl border border-white/30 bg-white/80 p-4 text-black backdrop-blur-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm">
              <FolderPlus className="size-4" /> Déposer / uploader
              <input className="hidden" multiple onChange={(event) => uploadFiles(event.target.files)} type="file" />
            </label>
            <button className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm" onClick={createFolder} type="button">
              Nouveau dossier
            </button>
          </div>

          <div className="mb-3 grid gap-2 md:grid-cols-3">
            <label className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs">
              <Search className="size-3" />
              <input className="w-full bg-transparent outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" value={query} />
            </label>
            <select className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs" onChange={(event) => setFilterType(event.target.value)} value={filterType}>
              <option value="all">Tous types</option>
              <option value="folder">Dossiers</option>
              <option value="image">Images</option>
              <option value="pdf">PDF</option>
              <option value="text">Texte</option>
            </select>
            <select className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs" onChange={(event) => setFilterTag(event.target.value)} value={filterTag}>
              <option value="">Tous tags</option>
              {uniqueTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-black/10 bg-white/70 p-2">
            <div className="hidden md:block">{renderNode(null)}</div>
            <div className="space-y-1 md:hidden">
              {filteredFiles.map((file) => (
                <button className="flex w-full items-center gap-2 rounded-lg border border-black/10 bg-white px-2 py-1 text-left text-sm" key={file.id} onClick={() => setSelected(file)} style={{ marginLeft: `${file.parentId ? 12 : 0}px` }} type="button">
                  {renderIcon(file)} {file.name}
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className="liquid-panel rounded-2xl border border-white/30 bg-white/80 p-4 text-black backdrop-blur-2xl">
          <h3 className="text-sm font-semibold">Prévisualisation</h3>
          <div className="mt-2">{renderPreview()}</div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold">Sources Web</h4>
            <div className="mt-2 flex gap-2">
              <input className="h-9 flex-1 rounded-lg border border-black/10 bg-white px-2 text-xs" onChange={(event) => setNewSourceUrl(event.target.value)} placeholder="https://..." value={newSourceUrl} />
              <button className="rounded-lg border border-black/10 bg-white px-3 text-xs" onClick={addWebSource} type="button">Ajouter</button>
            </div>

            <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
              {webSources.map((source) => (
                <a className="flex items-start gap-2 rounded-lg border border-black/10 bg-white/80 p-2" href={source.url} key={source.id} rel="noreferrer" target="_blank">
                  {source.faviconUrl ? <img alt="favicon" className="size-4" src={source.faviconUrl} /> : <Globe className="size-4" />}
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-xs font-medium">{source.title}</p>
                    <p className="line-clamp-1 text-[11px] text-black/60">{source.description || source.url}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
