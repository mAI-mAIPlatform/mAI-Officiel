"use client";

import {
  CircleHelp,
  Copy,
  Download,
  Heart,
  Library,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { areAllTierCreditsExhausted } from "@/lib/ai/credits";
import { affordableImageModels } from "@/lib/ai/affordable-models";
import { triggerHaptic } from "@/lib/haptics";
import { canConsumeUsage, consumeUsage, getUsageCount } from "@/lib/usage-limits";

const imageModels = affordableImageModels;
const LIBRARY_STORAGE_KEY = "mai.library.assets";
const STUDIO_GALLERY_STORAGE_KEY = "mai.studio.gallery.v1";

type StudioMode = "generate-image" | "edit-image";
type OutputPreset = "square" | "landscape" | "portrait" | "story" | "custom";
type StudioSection = "explorer" | "images" | "likes";
type LibrarySection = "mes-medias" | "favoris" | "telechargements" | "dechets";
type SortMode = "date" | "style" | "popularite" | "chronologique";
type ImageDownloadFormat = "png" | "jpeg" | "webp";

type StudioImageItem = {
  createdAt: string;
  deleted?: boolean;
  downloads: number;
  favorite: boolean;
  id: string;
  model: string;
  prompt: string;
  style: string;
  url: string;
};

const outputPresetSizes: Record<Exclude<OutputPreset, "custom">, string> = {
  square: "1024x1024",
  landscape: "1536x1024",
  portrait: "1024x1536",
  story: "1080x1920",
};

const quickStyles = [
  "Photo éditoriale premium",
  "Anime néon futuriste",
  "Cyberpunk pluie nocturne",
  "Cinematic noir 35mm",
  "Rendu 3D isométrique",
  "Illustration fantasy épique",
  "Aquarelle minimaliste",
  "Concept art sci-fi",
  "Affiche rétro vintage",
  "Macro ultra-réaliste",
];

const getStudioCreditCost = (imageCount: number): number => {
  if (imageCount <= 1) return 1;
  if (imageCount === 2) return 1.5;
  if (imageCount === 3) return 2;
  return 2.5;
};

export default function StudioPage() {
  const { currentPlanDefinition, plan } = useSubscriptionPlan();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [mode, setMode] = useState<StudioMode>("generate-image");
  const [prompt, setPrompt] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageModel, setImageModel] = useState(imageModels[0]?.id ?? "");
  const [error, setError] = useState("");
  const [outputPreset, setOutputPreset] = useState<OutputPreset>("portrait");
  const [customWidth, setCustomWidth] = useState("1024");
  const [customHeight, setCustomHeight] = useState("1024");
  const [variationCount, setVariationCount] = useState(2);
  const [activeSection, setActiveSection] = useState<StudioSection>("images");
  const [activeLibrarySection, setActiveLibrarySection] =
    useState<LibrarySection>("mes-medias");
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<ImageDownloadFormat>("png");
  const [gallery, setGallery] = useState<StudioImageItem[]>([]);
  const [activeImage, setActiveImage] = useState<StudioImageItem | null>(null);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorSaturation, setEditorSaturation] = useState(100);
  const [editorBlur, setEditorBlur] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageUploadRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STUDIO_GALLERY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setGallery(parsed);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STUDIO_GALLERY_STORAGE_KEY, JSON.stringify(gallery));
  }, [gallery]);

  const selectedSize = useMemo(() => {
    if (outputPreset !== "custom") return outputPresetSizes[outputPreset];
    const width = Number(customWidth);
    const height = Number(customHeight);
    const safeWidth = Number.isFinite(width)
      ? Math.max(256, Math.min(2048, Math.round(width)))
      : 1024;
    const safeHeight = Number.isFinite(height)
      ? Math.max(256, Math.min(2048, Math.round(height)))
      : 1024;
    return `${safeWidth}x${safeHeight}`;
  }, [customHeight, customWidth, outputPreset]);

  const styleLabel = selectedStyle || "Libre";

  const filteredGallery = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    let next = [...gallery].filter((item) => !item.deleted);

    if (activeSection === "likes") {
      next = next.filter((item) => item.favorite);
    }
    if (activeLibrarySection === "favoris") {
      next = next.filter((item) => item.favorite);
    }
    if (activeLibrarySection === "telechargements") {
      next = next.filter((item) => item.downloads > 0);
    }
    if (activeLibrarySection === "dechets") {
      next = gallery.filter((item) => item.deleted);
    }

    if (filterFavoritesOnly) next = next.filter((item) => item.favorite);
    if (styleFilter !== "all") {
      next = next.filter((item) => item.style.toLowerCase() === styleFilter.toLowerCase());
    }
    if (normalized) {
      next = next.filter((item) =>
        `${item.prompt} ${item.model} ${item.style}`.toLowerCase().includes(normalized)
      );
    }

    if (sortMode === "popularite") {
      return next.sort((a, b) => b.downloads - a.downloads);
    }
    if (sortMode === "style") {
      return next.sort((a, b) => a.style.localeCompare(b.style, "fr"));
    }
    if (sortMode === "chronologique") {
      return next.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
    return next.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [
    activeLibrarySection,
    activeSection,
    filterFavoritesOnly,
    gallery,
    searchQuery,
    sortMode,
    styleFilter,
  ]);

  const createSingleImage = async () => {
    const sourceImage =
      mode === "edit-image" ? imageInput || uploadedImages[0] : undefined;
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: mode,
        model: imageModel,
        prompt: selectedStyle ? `${prompt}, ${selectedStyle}` : prompt,
        image: sourceImage,
        size: selectedSize,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error ?? "Erreur de génération");
    }

    if (payload.pending && payload.id) {
      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        const statusRes = await fetch(`/api/studio/result/${payload.id}`);
        const statusPayload = await statusRes.json();
        if (statusPayload.finished) {
          if (statusPayload.error) throw new Error(statusPayload.error);
          return statusPayload.imageUrl as string;
        }
      }
      throw new Error("Génération trop longue.");
    }

    if (payload.imageUrl) return payload.imageUrl as string;
    if (payload.imageBase64) return `data:image/png;base64,${payload.imageBase64}`;
    throw new Error("Aucune image retournée par le modèle.");
  };

  const runStudio = async () => {
    if (!prompt.trim()) {
      setError("Veuillez saisir un prompt.");
      return;
    }
    if (areAllTierCreditsExhausted(plan, isAuthenticated)) {
      setError("Crédits IA épuisés: génération bloquée temporairement.");
      return;
    }

    const requestedCost = getStudioCreditCost(variationCount);
    if (
      !canConsumeUsage(
        "studio",
        "day",
        currentPlanDefinition.limits.studioImagesPerDay,
        requestedCost
      )
    ) {
      setError("Crédits images insuffisants pour ce nombre de variations.");
      return;
    }

    setError("");
    setIsLoading(true);
    triggerHaptic(20);

    try {
      const nextItems: StudioImageItem[] = [];
      for (let i = 0; i < variationCount; i += 1) {
        const url = await createSingleImage();
        nextItems.push({
          createdAt: new Date().toISOString(),
          downloads: 0,
          favorite: false,
          id: `${Date.now()}-${i}`,
          model: imageModel,
          prompt,
          style: styleLabel,
          url,
        });
      }

      if (nextItems.length === 0) {
        throw new Error("Aucune image générée (quota atteint ou réponse vide).");
      }
      consumeUsage("studio", "day", getStudioCreditCost(nextItems.length));

      setGallery((current) => [...nextItems, ...current]);
      setActiveSection("images");
      triggerHaptic([30, 40, 30]);
      toast.success(
        `${nextItems.length} image(s) générée(s) • -${getStudioCreditCost(
          nextItems.length
        )} crédits.`
      );
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (id: string) => {
    setGallery((current) =>
      current.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    );
    triggerHaptic(10);
  };

  const deleteImage = (id: string) => {
    setGallery((current) =>
      current.map((item) => (item.id === id ? { ...item, deleted: true } : item))
    );
    setActiveImage(null);
    triggerHaptic(12);
  };

  const downloadImage = async (
    item: StudioImageItem,
    format: ImageDownloadFormat = "png"
  ) => {
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      const dataUrl = await new Promise<string>((resolve, reject) => {
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth || image.width;
          canvas.height = image.naturalHeight || image.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Contexte canvas indisponible"));
            return;
          }
          ctx.drawImage(image, 0, 0);
          const mimeType =
            format === "jpeg"
              ? "image/jpeg"
              : format === "webp"
                ? "image/webp"
                : "image/png";
          resolve(canvas.toDataURL(mimeType, 0.92));
        };
        image.onerror = () => reject(new Error("Chargement image impossible"));
        image.src = item.url;
      });

      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `mai-studio-${item.id}.${format}`;
      anchor.click();
      setGallery((current) =>
        current.map((x) =>
          x.id === item.id ? { ...x, downloads: x.downloads + 1 } : x
        )
      );
      triggerHaptic(12);
    } catch {
      const anchor = document.createElement("a");
      anchor.href = item.url;
      anchor.download = `mai-studio-${item.id}.${format}`;
      anchor.click();
      toast.warning("Téléchargement direct utilisé (conversion indisponible).");
    }
  };

  const addToLibrary = (item: StudioImageItem) => {
    try {
      const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const next = [
        {
          id: `studio-${item.id}`,
          name: `Studio ${new Date(item.createdAt).toLocaleString("fr-FR")}.png`,
          type: "image",
          source: "mai-library",
          createdAt: item.createdAt,
          pinned: false,
          favorite: item.favorite,
          url: item.url,
        },
        ...(Array.isArray(existing) ? existing : []),
      ];
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(next));
      toast.success("Image ajoutée à /library.");
    } catch {
      toast.error("Ajout à la bibliothèque impossible.");
    }
  };

  const applyEditorAdjustments = () => {
    const source = activeImage?.url || imageInput || uploadedImages[0];
    if (!source) {
      toast.error("Aucune image à modifier.");
      return;
    }

    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.filter = `brightness(${editorBrightness}%) contrast(${editorContrast}%) saturate(${editorSaturation}%) blur(${editorBlur}px)`;
      ctx.drawImage(image, 0, 0);
      const updated = canvas.toDataURL("image/png");
      if (activeImage) {
        setGallery((current) =>
          current.map((item) => (item.id === activeImage.id ? { ...item, url: updated } : item))
        );
        setActiveImage((current) => (current ? { ...current, url: updated } : current));
      } else {
        setImageInput(updated);
      }
      toast.success("Retouches appliquées.");
    };
    image.src = source;
  };

  const onPromptImagesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(event.target.files ?? []);
    if (allFiles.length > 2) {
      toast.warning("Maximum 2 images importées. Les 2 premières ont été conservées.");
    }
    const files = allFiles.slice(0, 2);
    if (files.length === 0) return;

    if (files.some((file) => !file.type.startsWith("image/"))) {
      toast.error("Seules les images sont acceptées.");
      event.target.value = "";
      return;
    }

    const readFileAsDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("Impossible de lire l'image"));
        reader.readAsDataURL(file);
      });

    try {
      const loaded = (await Promise.all(files.map(readFileAsDataUrl))).filter(Boolean);
      if (loaded.length === 0) {
        toast.error("Import impossible.");
        return;
      }
      setUploadedImages(loaded);
      if (mode === "edit-image") {
        setImageInput(loaded[0]);
      }
      triggerHaptic(10);
      toast.success(`${loaded.length} image(s) importée(s).`);
    } catch {
      toast.error("Une erreur est survenue pendant l'import.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/70 p-4 lg:block">
        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Navigation</p>
        <div className="space-y-2">
          {[
            { id: "explorer", label: "Explorer" },
            { id: "images", label: "Images" },
            { id: "likes", label: "J'aime" },
          ].map((item) => (
            <button
              className={`w-full rounded-2xl px-3 py-2 text-left text-sm ${
                activeSection === item.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
              key={item.id}
              onClick={() => setActiveSection(item.id as StudioSection)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="mt-6 mb-3 text-xs font-semibold uppercase text-muted-foreground">Bibliothèque</p>
        <div className="space-y-2">
          {[
            { id: "mes-medias", label: "Mes médias" },
            { id: "favoris", label: "Favoris" },
            { id: "telechargements", label: "Téléchargements" },
            { id: "dechets", label: "Déchets" },
          ].map((item) => (
            <button
              className={`w-full rounded-2xl px-3 py-2 text-left text-sm ${
                activeLibrarySection === item.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
              key={item.id}
              onClick={() => setActiveLibrarySection(item.id as LibrarySection)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Studio: {getUsageCount("studio", "day")} / {currentPlanDefinition.limits.studioImagesPerDay} images
        </p>
      </aside>

      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/50 p-4 xl:block">
        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Filtres</p>
        <div className="space-y-3 text-sm">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">IA utilisée</label>
            <select
              className="h-9 w-full rounded-xl border border-border bg-background px-3"
              onChange={(event) => setImageModel(event.target.value)}
              value={imageModel}
            >
              {imageModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Style visuel</label>
            <select
              className="h-9 w-full rounded-xl border border-border bg-background px-3"
              onChange={(event) => setStyleFilter(event.target.value)}
              value={styleFilter}
            >
              <option value="all">Tous</option>
              {quickStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Tri</label>
            <select
              className="h-9 w-full rounded-xl border border-border bg-background px-3"
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              value={sortMode}
            >
              <option value="date">Date</option>
              <option value="style">Style</option>
              <option value="popularite">Popularité</option>
              <option value="chronologique">Ordre chronologique</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              checked={filterFavoritesOnly}
              onChange={(event) => setFilterFavoritesOnly(event.target.checked)}
              type="checkbox"
            />
            Favoris uniquement
          </label>
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-10 border-b border-border/50 bg-background/90 p-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              className="h-9 w-full rounded-xl border border-border bg-background px-4 text-sm"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher par prompt, style, modèle..."
              type="search"
              value={searchQuery}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "Aujourd'hui",
              "Cette semaine",
              "Ce mois",
              "Favoris",
              "Téléchargées",
            ].map((chip) => (
              <button className="rounded-2xl border border-border px-3 py-1 text-xs hover:bg-muted" key={chip} type="button">
                {chip}
              </button>
            ))}
          </div>
        </div>

        <section className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="studio-loader my-6">
              <div className="studio-loader__ring" />
              <div className="studio-loader__orbit">
                <span className="studio-loader__star">✦</span>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {filteredGallery.map((item) => (
              <article
                className="animate-[fade-in_.3s_ease] overflow-hidden rounded-xl border border-border/60 bg-card/80"
                key={item.id}
              >
                {/* biome-ignore lint/performance/noImgElement: generated images */}
                <img
                  alt={item.prompt}
                  className="h-44 w-full object-cover"
                  onClick={() => setActiveImage(item)}
                  src={item.url}
                />
                <div className="space-y-1 p-2 text-xs">
                  <p className="line-clamp-1 text-muted-foreground">{item.style}</p>
                  <p className="line-clamp-2">{item.prompt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    <button onClick={() => toggleFavorite(item.id)} type="button">
                      <Heart className={`size-4 ${item.favorite ? "fill-current text-rose-500" : ""}`} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sticky bottom-0 z-20 border-t border-border/50 bg-background/95 p-3 backdrop-blur">
          <div className="rounded-3xl border border-border bg-card/80 p-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded-2xl border border-border p-2.5"
                onClick={() => imageUploadRef.current?.click()}
                type="button"
                title="Importer 1 à 2 images"
              >
                <Plus className="size-4" />
              </button>
              <input
                accept="image/*"
                className="hidden"
                multiple
                onChange={onPromptImagesSelected}
                ref={imageUploadRef}
                type="file"
              />
              <textarea
                className="min-h-12 flex-1 resize-none rounded-2xl border border-border bg-background p-3 text-sm"
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Décrivez votre image..."
                value={prompt}
              />
              <Button disabled={isLoading} onClick={runStudio}>
                <Sparkles className="mr-1 size-4" /> Générer
              </Button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {[
                ["square", "1:1"],
                ["landscape", "16:9"],
                ["portrait", "4:5"],
              ].map(([id, label]) => (
                <button
                  className={`rounded-2xl border px-3 py-1 ${
                    outputPreset === id ? "border-primary text-primary" : "border-border"
                  }`}
                  key={id}
                  onClick={() => setOutputPreset(id as OutputPreset)}
                  type="button"
                >
                  {label}
                </button>
              ))}
              <select
                className="h-8 rounded-2xl border border-border bg-background px-3"
                onChange={(event) => setVariationCount(Number(event.target.value))}
                value={variationCount}
              >
                <option value={1}>1v</option>
                <option value={2}>2v</option>
                <option value={3}>3v</option>
                <option value={4}>4v</option>
              </select>
              <button
                className="rounded-2xl border border-border px-3 py-1"
                onClick={() => setShowStylePicker((current) => !current)}
                type="button"
              >
                Styles
              </button>
              <button
                className="rounded-2xl border border-border px-3 py-1"
                onClick={() => setShowHelp((current) => !current)}
                type="button"
              >
                <CircleHelp className="mr-1 inline size-3.5" /> Aide
              </button>
              <button
                className="rounded-2xl border border-border px-3 py-1"
                onClick={() => setMode((current) => (current === "generate-image" ? "edit-image" : "generate-image"))}
                type="button"
              >
                <WandSparkles className="mr-1 inline size-3.5" />
                {mode === "generate-image" ? "Mode édition" : "Mode génération"}
              </button>
            </div>

            {showStylePicker && (
              <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-border/60 bg-background/70 p-2">
                {quickStyles.map((style) => (
                  <button
                    className={`rounded-full border px-3 py-1 text-xs ${
                      selectedStyle === style ? "border-primary text-primary" : "border-border"
                    }`}
                    key={style}
                    onClick={() => {
                      setSelectedStyle(style);
                      triggerHaptic(10);
                    }}
                    type="button"
                  >
                    {style}
                  </button>
                ))}
              </div>
            )}

            {uploadedImages.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/70 p-2">
                {uploadedImages.map((imageSrc, index) => (
                  <div className="relative" key={`${imageSrc.slice(0, 24)}-${index}`}>
                    {/* biome-ignore lint/performance/noImgElement: local image preview */}
                    <img
                      alt={`Import ${index + 1}`}
                      className="h-12 w-12 rounded-md object-cover"
                      src={imageSrc}
                    />
                    <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                      {index + 1}
                    </span>
                  </div>
                ))}
                <button
                  className="rounded-full border border-border px-2 py-1 text-xs"
                  onClick={() => {
                    setUploadedImages([]);
                  }}
                  type="button"
                >
                  Retirer
                </button>
                <span className="text-[11px] text-muted-foreground">Max 2 images</span>
              </div>
            )}

            {showHelp && (
              <p className="mt-2 text-xs text-muted-foreground">
                Conseil: indique le sujet, le style, la lumière, l&apos;ambiance et les
                détails de composition. Exemple: "portrait cinématique, lumière douce,
                profondeur de champ, rendu ultra détaillé".
              </p>
            )}

            {mode === "edit-image" && (
              <div className="mt-3 rounded-xl border border-border/60 bg-background/70 p-2">
                <label className="text-xs">Image source (URL/DataURI)</label>
                <textarea
                  className="mt-1 min-h-16 w-full rounded-md border border-border bg-background p-2 text-xs"
                  onChange={(event) => setImageInput(event.target.value)}
                  placeholder="https://... ou data:image/..."
                  value={imageInput}
                />
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <label className="text-xs">
                    Luminosité {editorBrightness}%
                    <input
                      className="w-full"
                      max={180}
                      min={40}
                      onChange={(event) => setEditorBrightness(Number(event.target.value))}
                      type="range"
                      value={editorBrightness}
                    />
                  </label>
                  <label className="text-xs">
                    Contraste {editorContrast}%
                    <input
                      className="w-full"
                      max={180}
                      min={40}
                      onChange={(event) => setEditorContrast(Number(event.target.value))}
                      type="range"
                      value={editorContrast}
                    />
                  </label>
                  <label className="text-xs">
                    Saturation {editorSaturation}%
                    <input
                      className="w-full"
                      max={220}
                      min={0}
                      onChange={(event) => setEditorSaturation(Number(event.target.value))}
                      type="range"
                      value={editorSaturation}
                    />
                  </label>
                  <label className="text-xs">
                    Flou {editorBlur}px
                    <input
                      className="w-full"
                      max={8}
                      min={0}
                      onChange={(event) => setEditorBlur(Number(event.target.value))}
                      step={0.5}
                      type="range"
                      value={editorBlur}
                    />
                  </label>
                </div>
                <Button className="mt-2" onClick={applyEditorAdjustments} size="sm" type="button" variant="outline">
                  Appliquer les retouches
                </Button>
                <canvas className="hidden" ref={canvasRef} />
              </div>
            )}

            {error && (
              <div className="mt-2 rounded-md border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-600">
                {error}
              </div>
            )}
          </div>
        </section>
      </main>

      {activeImage && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-background p-3">
            {/* biome-ignore lint/performance/noImgElement: generated images */}
            <img alt={activeImage.prompt} className="max-h-[70vh] w-full rounded-lg object-contain" src={activeImage.url} />
            <p className="mt-2 text-sm text-muted-foreground">{activeImage.prompt}</p>
            <p className="text-xs text-muted-foreground">
              {activeImage.style} • {activeImage.model} • {new Date(activeImage.createdAt).toLocaleString("fr-FR")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                className="h-9 rounded-md border border-border/60 bg-background px-2 text-xs"
                onChange={(event) =>
                  setDownloadFormat(event.target.value as ImageDownloadFormat)
                }
                value={downloadFormat}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WEBP</option>
              </select>
              <Button
                onClick={() => downloadImage(activeImage, downloadFormat)}
                size="sm"
                variant="outline"
              >
                <Download className="mr-1 size-4" /> Télécharger
              </Button>
              <Button onClick={() => toggleFavorite(activeImage.id)} size="sm" variant="outline">
                <Heart className="mr-1 size-4" /> Favori
              </Button>
              <Button onClick={() => addToLibrary(activeImage)} size="sm" variant="outline">
                <Library className="mr-1 size-4" /> Bibliothèque
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(activeImage.url);
                  triggerHaptic(10);
                }}
                size="sm"
                variant="outline"
              >
                <Copy className="mr-1 size-4" /> Copier
              </Button>
              <Button
                onClick={() => {
                  setPrompt(activeImage.prompt);
                  setMode("generate-image");
                  setActiveImage(null);
                }}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="mr-1 size-4" /> Remix
              </Button>
              <Button onClick={() => deleteImage(activeImage.id)} size="sm" variant="destructive">
                <Trash2 className="mr-1 size-4" /> Supprimer
              </Button>
              <Button onClick={() => setActiveImage(null)} size="sm" variant="ghost">
                Fermer
              </Button>
              <Button size="sm" variant="outline">
                <Share2 className="mr-1 size-4" /> Partager
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
