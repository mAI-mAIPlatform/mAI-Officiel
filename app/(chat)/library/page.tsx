"use client";

import {
  Download,
  Eye,
  FileImage,
  FileText,
  Pencil,
  Pin,
  PinOff,
  Search,
  ShieldAlert,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
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
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";

type LibraryAssetType = "image" | "document";
type LibraryAssetSource = "device" | "mai-library";

type LibraryAsset = {
  id: string;
  name: string;
  type: LibraryAssetType;
  source: LibraryAssetSource;
  createdAt: string;
  pinned: boolean;
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
    url: "/images/demo-thumbnail.png",
  },
  {
    id: "sample-doc-1",
    name: "Plan produit Q2.txt",
    type: "document",
    source: "mai-library",
    createdAt: new Date().toISOString(),
    pinned: false,
    url: "",
  },
];

export default function LibraryPage() {
  const { plan } = useSubscriptionPlan();
  const [assets, setAssets] = useState<LibraryAsset[]>(initialAssets);
  const [searchTerm, setSearchTerm] = useState("");
  const [importSource, setImportSource] =
    useState<LibraryAssetSource>("device");
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [renamingAssetId, setRenamingAssetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [previewAsset, setPreviewAsset] = useState<LibraryAsset | null>(null);
  const storageLimit = useMemo(() => {
    if (plan === "max") {
      return 100;
    }
    if (plan === "pro") {
      return 50;
    }
    if (plan === "plus") {
      return 30;
    }
    return 20;
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
        setAssets(parsed);
      }
    } catch {
      setAssets(initialAssets);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const base = [...assets].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned)
    );
    if (!normalizedSearch) {
      return base;
    }
    return base.filter((asset) =>
      `${asset.name} ${asset.type} ${asset.source}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [assets, searchTerm]);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
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
        source: importSource,
        createdAt: new Date().toISOString(),
        pinned: false,
        url,
      },
      ...current,
    ]);

    event.target.value = "";
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

    setAssets((current) =>
      current.filter((asset) => asset.id !== assetToDelete)
    );
    setAssetToDelete(null);
  };

  const handleOpenAsset = (asset: LibraryAsset) => {
    setPreviewAsset(asset);
    const anchor = document.createElement("a");
    anchor.href =
      asset.url || `data:text/plain,${encodeURIComponent(asset.name)}`;
    anchor.download = asset.name;
    anchor.click();
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
          <select
            className="h-9 rounded-xl border border-border/50 bg-background/70 px-3 text-xs"
            onChange={(event) =>
              setImportSource(event.target.value as LibraryAssetSource)
            }
            value={importSource}
          >
            <option value="device">Source : Appareil local</option>
            <option value="mai-library">Source : Bibliothèque mAI</option>
          </select>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border/60 px-3 text-xs hover:bg-muted/40">
            <UploadCloud className="size-4" /> Importer
            <input className="hidden" onChange={handleImport} type="file" />
          </label>
        </div>
      </header>

      <section className="rounded-2xl border border-border/60 bg-card/65 p-4 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm focus:outline-none"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un média, un type ou une source..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssets.map((asset) => (
            <article
              className="liquid-glass rounded-2xl border border-border/50 bg-background/45 p-3"
              key={asset.id}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {asset.type === "image" ? (
                    <FileImage className="size-4" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                  <span>{asset.source === "device" ? "Appareil" : "mAI"}</span>
                </div>
                <button
                  className="rounded-md p-1 hover:bg-muted"
                  onClick={() =>
                    setAssets((current) =>
                      current.map((currentAsset) =>
                        currentAsset.id === asset.id
                          ? { ...currentAsset, pinned: !currentAsset.pinned }
                          : currentAsset
                      )
                    )
                  }
                  type="button"
                >
                  {asset.pinned ? (
                    <PinOff className="size-4 text-amber-500" />
                  ) : (
                    <Pin className="size-4" />
                  )}
                </button>
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

              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={() => handleOpenAsset(asset)}
                  size="sm"
                  variant="outline"
                >
                  <Eye className="mr-1 size-3.5" /> Ouvrir
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
            </article>
          ))}
        </div>

        {filteredAssets.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
            Aucun média trouvé. Essayez une autre recherche ou importez un
            fichier.
          </div>
        )}
      </section>

      {previewAsset && (
        <section className="liquid-glass rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Aperçu instantané</h3>
            <Button
              onClick={() => handleOpenAsset(previewAsset)}
              size="sm"
              variant="outline"
            >
              <Download className="mr-1 size-3.5" />
              Télécharger à nouveau
            </Button>
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

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300">
          <ShieldAlert className="size-4" />
          <p className="text-xs font-medium">Suppression sécurisée activée</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Les suppressions demandent une confirmation pour éviter les pertes
          accidentelles.
        </p>
      </section>

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
