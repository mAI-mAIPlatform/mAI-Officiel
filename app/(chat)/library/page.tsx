"use client";

import {
  Copy,
  Download,
  EllipsisVertical,
  Eye,
  FileText,
  Heart,
  Pencil,
  Pin,
  PinOff,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";

type LibraryAssetType = "image" | "document";
type LibraryAssetSource = "device" | "mai-library";
type FilterMode = "all" | "favorites" | "recent";
type ViewMode = "grid" | "list";
type SortMode = "date" | "name";

type LibraryAsset = {
  id: string;
  name: string;
  type: LibraryAssetType;
  source: LibraryAssetSource;
  createdAt: string;
  pinned: boolean;
  favorite: boolean;
  url: string;
};

const STORAGE_KEY = "mai.library.assets";

const initialAssets: LibraryAsset[] = [
  {
    id: "sample-image-1",
    name: "Inspiration studio.png",
    type: "image",
    source: "mai-library",
    createdAt: new Date().toISOString(),
    pinned: true,
    favorite: true,
    url: "/images/demo-thumbnail.png",
  },
  {
    id: "sample-doc-1",
    name: "Plan produit Q2.txt",
    type: "document",
    source: "mai-library",
    createdAt: new Date().toISOString(),
    pinned: false,
    favorite: false,
    url: "",
  },
];

export default function LibraryPage() {
  const { plan } = useSubscriptionPlan();
  const router = useRouter();
  const [assets, setAssets] = useState<LibraryAsset[]>(initialAssets);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [renamingAssetId, setRenamingAssetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [previewAsset, setPreviewAsset] = useState<LibraryAsset | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [summaryByAssetId, setSummaryByAssetId] = useState<Record<string, string>>({});

  const storageLimit = useMemo(() => {
    if (plan === "max") {
      return 100;
    }
    if (plan === "pro") {
      return 70;
    }
    if (plan === "plus") {
      return 50;
    }
    return 30;
  }, [plan]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAssets));
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setAssets(
          parsed.map((asset) => ({
            ...asset,
            favorite: Boolean(asset.favorite),
            pinned: Boolean(asset.pinned),
          }))
        );
      }
    } catch {
      setAssets(initialAssets);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    return () => {
      for (const asset of assets) {
        if (asset.url.startsWith("blob:")) {
          URL.revokeObjectURL(asset.url);
        }
      }
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const sorted = [...assets].sort((a, b) => {
      if (Number(b.pinned) !== Number(a.pinned)) {
        return Number(b.pinned) - Number(a.pinned);
      }
      if (sortMode === "name") {
        return a.name.localeCompare(b.name, "fr");
      }
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });

    const byFilter = sorted.filter((asset) => {
      if (filterMode === "favorites") {
        return asset.favorite;
      }
      if (filterMode === "recent") {
        return (
          +new Date(asset.createdAt) >= Date.now() - 7 * 24 * 60 * 60 * 1000
        );
      }
      return true;
    });

    if (!normalizedSearch) {
      return byFilter;
    }

    return byFilter.filter((asset) =>
      `${asset.name} ${asset.type} ${asset.source}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [assets, filterMode, searchTerm, sortMode]);

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (assets.length >= storageLimit) {
      toast.error(
        `Limite atteinte pour ${plan.toUpperCase()} : ${storageLimit} fichiers maximum.`
      );
      event.target.value = "";
      return;
    }

    const url = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";

    setAssets((current) => [
      {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "document",
        source: "device",
        createdAt: new Date().toISOString(),
        pinned: false,
        favorite: false,
        url,
      },
      ...current,
    ]);

    event.target.value = "";
  };

  const duplicateAsset = (asset: LibraryAsset) => {
    if (assets.length >= storageLimit) {
      toast.error("Duplication impossible : quota atteint.");
      return;
    }

    setAssets((current) => [
      {
        ...asset,
        id: crypto.randomUUID(),
        name: `${asset.name} (copie)`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  };

  const openRenameEditor = (asset: LibraryAsset) => {
    setRenamingAssetId(asset.id);
    setRenameValue(asset.name);
  };

  const commitRename = () => {
    if (!renamingAssetId || !renameValue.trim()) {
      return;
    }

    setAssets((current) =>
      current.map((asset) =>
        asset.id === renamingAssetId
          ? { ...asset, name: renameValue.trim() }
          : asset
      )
    );
    setRenamingAssetId(null);
    setRenameValue("");
  };

  const handleDelete = () => {
    if (!assetToDelete) {
      return;
    }

    setAssets((current) => {
      const asset = current.find((candidate) => candidate.id === assetToDelete);
      if (asset?.url.startsWith("blob:")) {
        URL.revokeObjectURL(asset.url);
      }
      return current.filter((candidate) => candidate.id !== assetToDelete);
    });

    setAssetToDelete(null);
  };

  const handleDropImport = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const first = files[0];
    if (!first) {
      return;
    }

    const event = {
      target: { files: [first], value: "" },
    } as unknown as ChangeEvent<HTMLInputElement>;
    handleImport(event);
  };

  const handleOpenAsset = (asset: LibraryAsset) => {
    if (previewAsset?.id === asset.id) {
      setPreviewAsset(null);
      return;
    }

    const pendingKey = "mai.chat.pending-library-attachments";
    const existingRaw = localStorage.getItem(pendingKey);
    const existing = existingRaw ? (JSON.parse(existingRaw) as unknown[]) : [];
    const contentType = asset.type === "image" ? "image/*" : "text/plain";

    localStorage.setItem(
      pendingKey,
      JSON.stringify([
        {
          url: asset.url || `data:text/plain,${encodeURIComponent(asset.name)}`,
          name: asset.name,
          contentType,
          fromLibrary: true,
        },
        ...existing,
      ])
    );

    setPreviewAsset(asset);
    router.push("/");
    toast.success("Fichier prêt à être utilisé dans le chat.");
  };

  const summarizeAsset = async (asset: LibraryAsset) => {
    try {
      let content = "";
      if (asset.url.startsWith("data:text")) {
        const [, encoded = ""] = asset.url.split(",", 2);
        content = decodeURIComponent(encoded);
      } else if (asset.url.startsWith("blob:")) {
        const response = await fetch(asset.url);
        content = await response.text();
      } else {
        content = asset.name;
      }

      const response = await fetch("/api/library/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: asset.name, content: content.slice(0, 12000) }),
      });
      const payload = (await response.json()) as { summary?: string; error?: string };
      if (!response.ok || !payload.summary) {
        throw new Error(payload.error ?? "Résumé indisponible");
      }
      setSummaryByAssetId((current) => ({ ...current, [asset.id]: payload.summary ?? "" }));
      toast.success("Résumé IA généré.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec du résumé.");
    }
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-5 overflow-y-auto p-6 md:p-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Bibliothèque</h1>
          <p className="text-sm text-muted-foreground">
            Répertoire centralisé de vos photos, documents et créations Studio.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Stockage {plan.toUpperCase()} : {assets.length}/{storageLimit}{" "}
            fichiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-background/50 p-2 backdrop-blur-xl">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border/60 px-3 text-xs hover:bg-muted/40">
            <UploadCloud className="size-4" /> Importer
            <input className="hidden" onChange={handleImport} type="file" />
          </label>
        </div>
      </header>

      <section
        className="rounded-2xl border border-border/60 bg-card/65 p-4 backdrop-blur-xl"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleDropImport(event.dataTransfer.files);
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Recherche instantanée</span>
          <div className="flex items-center gap-2">
            <select
              className="h-7 rounded-lg border border-border/60 bg-background/60 px-2 text-[11px]"
              onChange={(event) => setViewMode(event.target.value as ViewMode)}
              value={viewMode}
            >
              <option value="grid">Vue grille</option>
              <option value="list">Vue liste</option>
            </select>
            <select
              className="h-7 rounded-lg border border-border/60 bg-background/60 px-2 text-[11px]"
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              value={sortMode}
            >
              <option value="date">Tri date</option>
              <option value="name">Tri nom</option>
            </select>
            <select
              className="h-7 rounded-lg border border-border/60 bg-background/60 px-2 text-[11px]"
              onChange={(event) =>
                setFilterMode(event.target.value as FilterMode)
              }
              value={filterMode}
            >
              <option value="all">Tous</option>
              <option value="favorites">Favoris</option>
              <option value="recent">Ajouts 7 jours</option>
            </select>
            {searchTerm.trim() ? (
              <button
                className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[11px] transition-colors hover:border-primary/40 hover:text-foreground"
                onClick={() => setSearchTerm("")}
                type="button"
              >
                Effacer
              </button>
            ) : null}
          </div>
        </div>

        <div className="mb-4 flex min-h-11 items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          <Search className="size-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm focus:outline-none"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nom, type (image/document) ou source…"
            type="search"
            value={searchTerm}
          />
        </div>

        <div
          className={
            viewMode === "grid"
              ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3"
              : "space-y-3"
          }
        >
          {filteredAssets.map((asset) => (
            <article
              className="liquid-glass rounded-2xl border border-border/50 bg-background/45 p-3"
              key={asset.id}
            >
              <div className="mb-3 flex items-center justify-between">
                <div />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-md p-1 hover:bg-muted" type="button">
                      <EllipsisVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleOpenAsset(asset)}><Eye className="mr-2 size-4" />Ouvrir</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => summarizeAsset(asset)}><FileText className="mr-2 size-4" />Résumer (IA)</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openRenameEditor(asset)}><Pencil className="mr-2 size-4" />Renommer</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => duplicateAsset(asset)}><Copy className="mr-2 size-4" />Dupliquer</DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        setAssets((current) =>
                          current.map((currentAsset) =>
                            currentAsset.id === asset.id
                              ? { ...currentAsset, pinned: !currentAsset.pinned }
                              : currentAsset
                          )
                        )
                      }
                    >
                      {asset.pinned ? <PinOff className="mr-2 size-4" /> : <Pin className="mr-2 size-4" />}
                      {asset.pinned ? "Désépingler" : "Épingler"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setAssetToDelete(asset.id)} className="text-red-600">
                      <Trash2 className="mr-2 size-4" />Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {asset.url ? (
                <Image
                  alt={asset.name}
                  className="mb-3 h-36 w-full rounded-xl border border-border/50 object-cover"
                  height={144}
                  src={asset.url}
                  unoptimized={asset.url.startsWith("blob:")}
                  width={320}
                />
              ) : (
                <div className="mb-3 flex h-36 items-center justify-center rounded-xl border border-dashed border-border/50 text-xs text-muted-foreground">
                  Aperçu non disponible (document)
                </div>
              )}

              {renamingAssetId === asset.id ? (
                <div className="space-y-2">
                  <input
                    className="h-8 w-full rounded-lg border border-border/60 bg-background/70 px-2 text-sm"
                    onChange={(event) => setRenameValue(event.target.value)}
                    value={renameValue}
                  />
                  <div className="flex gap-2">
                    <Button onClick={commitRename} size="sm" variant="outline">
                      Valider
                    </Button>
                    <Button
                      onClick={() => setRenamingAssetId(null)}
                      size="sm"
                      variant="ghost"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="line-clamp-2 text-sm font-medium">{asset.name}</p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ajouté le {new Date(asset.createdAt).toLocaleString()}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => handleOpenAsset(asset)}
                  size="sm"
                  variant="outline"
                >
                  <Eye className="mr-1 size-3.5" /> Ouvrir
                </Button>
                <Button
                  onClick={() =>
                    setAssets((current) =>
                      current.map((item) =>
                        item.id === asset.id
                          ? { ...item, favorite: !item.favorite }
                          : item
                      )
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  <Heart
                    className={`mr-1 size-3.5 ${asset.favorite ? "fill-current text-rose-500" : ""}`}
                  />
                  Favori
                </Button>
                <Button
                  onClick={() => duplicateAsset(asset)}
                  size="sm"
                  variant="outline"
                >
                  <Copy className="mr-1 size-3.5" /> Dupliquer
                </Button>
                <Button
                  onClick={() => openRenameEditor(asset)}
                  size="sm"
                  variant="outline"
                >
                  <Pencil className="mr-1 size-3.5" /> Renommer
                </Button>
                <Button
                  className="text-red-500 hover:text-red-500"
                  onClick={() => setAssetToDelete(asset.id)}
                  size="sm"
                  variant="outline"
                >
                  <Trash2 className="mr-1 size-3.5" /> Supprimer
                </Button>
              </div>
              {summaryByAssetId[asset.id] ? (
                <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-2 text-xs text-violet-900">
                  <p className="font-semibold">Résumé IA</p>
                  <p className="mt-1 whitespace-pre-wrap">{summaryByAssetId[asset.id]}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {filteredAssets.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
            Aucun média trouvé. Essayez une autre recherche, un autre filtre ou
            importez un fichier.
          </div>
        )}
      </section>

      {previewAsset && (
        <section className="liquid-glass rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Aperçu instantané</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleOpenAsset(previewAsset)}
                size="sm"
                variant="outline"
              >
                <Download className="mr-1 size-3.5" />
                Ajouter au chat
              </Button>
              <Button
                onClick={() => setPreviewAsset(null)}
                size="sm"
                type="button"
                variant="ghost"
              >
                Fermer
              </Button>
            </div>
          </div>
          {previewAsset.url ? (
            <Image
              alt={previewAsset.name}
              className="max-h-56 w-full rounded-xl border border-border/50 object-contain"
              height={240}
              src={previewAsset.url}
              unoptimized={previewAsset.url.startsWith("blob:")}
              width={480}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
              Document sélectionné : {previewAsset.name}
            </p>
          )}
        </section>
      )}

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setAssetToDelete(null);
          }
        }}
        open={Boolean(assetToDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Suppression sécurisée : cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
