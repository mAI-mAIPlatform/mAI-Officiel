"use client";

import {
  Copy,
  Download,
  ImagePlus,
  Library,
  RefreshCw,
  Upload,
  WandSparkles,
} from "lucide-react";
import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { areAllTierCreditsExhausted } from "@/lib/ai/credits";
import { affordableImageModels } from "@/lib/ai/affordable-models";
import { triggerHaptic } from "@/lib/haptics";
import {
  canConsumeUsage,
  consumeUsage,
  getUsageCount,
} from "@/lib/usage-limits";

const imageModels = affordableImageModels;
const LIBRARY_STORAGE_KEY = "mai.library.assets";

type StudioMode = "generate-image" | "edit-image";
type OutputPreset = "square" | "landscape" | "portrait" | "story" | "custom";

const outputPresetSizes: Record<Exclude<OutputPreset, "custom">, string> = {
  square: "1024x1024",
  landscape: "1536x1024",
  portrait: "1024x1536",
  story: "1080x1920",
};

export default function StudioPage() {
  const { currentPlanDefinition, plan } = useSubscriptionPlan();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [mode, setMode] = useState<StudioMode>("generate-image");
  const [prompt, setPrompt] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageModel, setImageModel] = useState(imageModels[0]?.id ?? "");
  const [resultImage, setResultImage] = useState("");
  const [resultProvider, setResultProvider] = useState("");
  const [error, setError] = useState("");
  const [importSource, setImportSource] = useState<"device" | "mai-library">(
    "device"
  );
  const [outputPreset, setOutputPreset] = useState<OutputPreset>("portrait");
  const [customWidth, setCustomWidth] = useState("1024");
  const [customHeight, setCustomHeight] = useState("1024");
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorSaturation, setEditorSaturation] = useState(100);
  const [editorBlur, setEditorBlur] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedSize = useMemo(() => {
    if (outputPreset !== "custom") {
      return outputPresetSizes[outputPreset];
    }

    const width = Number(customWidth);
    const height = Number(customHeight);
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      return "1024x1024";
    }

    const safeWidth = Math.max(256, Math.min(2048, Math.round(width)));
    const safeHeight = Math.max(256, Math.min(2048, Math.round(height)));
    return `${safeWidth}x${safeHeight}`;
  }, [customHeight, customWidth, outputPreset]);

  const currentModel = imageModel;

  const onImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Value =
        typeof reader.result === "string" ? reader.result : "";
      setImageInput(base64Value);
    };
    reader.onerror = () => {
      setError("Import impossible. Veuillez réessayer avec une autre image.");
    };
    reader.readAsDataURL(file);
  };

  const runStudio = async () => {
    if (!prompt.trim()) {
      setError("Veuillez saisir un prompt.");
      return;
    }

    if (areAllTierCreditsExhausted(plan, isAuthenticated)) {
      setError(
        "Crédits IA épuisés: génération d'image bloquée jusqu'à la réinitialisation."
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setResultImage("");

    if (
      !canConsumeUsage(
        "studio",
        "day",
        currentPlanDefinition.limits.studioImagesPerDay
      )
    ) {
      setError("Limite journalière de studio atteinte pour votre forfait.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          model: currentModel,
          prompt,
          image: mode === "edit-image" ? imageInput : undefined,
          size: selectedSize,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Erreur de génération");
      }

      setResultProvider(payload.provider ?? "provider inconnu");

      if (payload.pending && payload.id) {
        consumeUsage("studio", "day");

        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          if (attempts > 120) {
            clearInterval(poll);
            setError("Génération longue, veuillez réessayer plus tard.");
            setIsLoading(false);
            return;
          }

          try {
            const statusRes = await fetch(`/api/studio/result/${payload.id}`);
            if (!statusRes.ok) {
              throw new Error("Erreur lors de la vérification du statut");
            }
            const statusPayload = await statusRes.json();

            if (statusPayload.finished) {
              clearInterval(poll);
              if (statusPayload.error) {
                setError(statusPayload.error);
              } else if (statusPayload.imageUrl) {
                setResultImage(statusPayload.imageUrl);
              }
              setIsLoading(false);
            }
          } catch (pollError) {
            console.error(pollError);
          }
        }, 5000);
        return;
      }
      consumeUsage("studio", "day");

      if (payload.type === "image") {
        if (payload.imageUrl) {
          setResultImage(payload.imageUrl);
        } else if (payload.imageBase64) {
          setResultImage(`data:image/png;base64,${payload.imageBase64}`);
        }
      }
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : "Erreur inconnue"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyError = async () => {
    if (!error) return;
    await navigator.clipboard.writeText(error);
    toast.success("Erreur copiée.");
    triggerHaptic(10);
  };

  const copyImage = async () => {
    if (!resultImage) return;
    await navigator.clipboard.writeText(resultImage);
    toast.success("Lien/image copiée.");
    triggerHaptic(12);
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const anchor = document.createElement("a");
    anchor.href = resultImage;
    anchor.download = `mai-studio-${Date.now()}.png`;
    anchor.click();
    triggerHaptic(12);
  };

  const addToLibrary = () => {
    if (!resultImage) return;
    try {
      const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const next = [
        {
          id: `studio-${Date.now()}`,
          name: `Studio ${new Date().toLocaleString("fr-FR")}.png`,
          type: "image",
          source: "mai-library",
          createdAt: new Date().toISOString(),
          pinned: false,
          favorite: false,
          url: resultImage,
        },
        ...(Array.isArray(existing) ? existing : []),
      ];
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(next));
      toast.success("Image ajoutée à la bibliothèque.");
      triggerHaptic([10, 40, 12]);
    } catch {
      toast.error("Ajout à la bibliothèque impossible.");
    }
  };

  const applyEditorAdjustments = () => {
    const source = resultImage || imageInput;
    if (!source) {
      toast.error("Aucune image à éditer.");
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Éditeur indisponible.");
        return;
      }

      ctx.filter = `brightness(${editorBrightness}%) contrast(${editorContrast}%) saturate(${editorSaturation}%) blur(${editorBlur}px)`;
      ctx.drawImage(image, 0, 0);
      const updated = canvas.toDataURL("image/png");
      setImageInput(updated);
      setResultImage(updated);
      triggerHaptic([12, 30, 12]);
      toast.success("Retouches appliquées.");
    };
    image.onerror = () => toast.error("Impossible de charger l'image à éditer.");
    image.src = source;
  };

  const enhancePrompt = () => {
    if (!prompt.trim()) {
      setPrompt("Illustration cinématographique, détails fins, éclairage studio");
      return;
    }
    setPrompt(
      `${prompt.trim()}, ultra détaillé, composition équilibrée, qualité élevée, sans texte déformé`
    );
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-4 text-black md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Studio</h1>
          <p className="text-sm text-black/70">
            Génération et édition d&apos;images (image-to-image + édition rapide).
          </p>
        </div>
        <div className="flex gap-2 rounded-2xl border border-black/20 bg-white/70 p-1 backdrop-blur-xl">
          {[
            { id: "generate-image", label: "Image", icon: ImagePlus },
            { id: "edit-image", label: "Édition IA", icon: WandSparkles },
          ].map((item) => (
            <button
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition ${
                mode === item.id ? "bg-cyan-200 text-black" : "text-black/65"
              }`}
              key={item.id}
              onClick={() => setMode(item.id as StudioMode)}
              type="button"
            >
              <item.icon className="size-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mb-2 text-xs text-black/60">
        Utilisation quotidienne : {getUsageCount("studio", "day")} /{" "}
        {currentPlanDefinition?.limits?.studioImagesPerDay || 0}
      </div>
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="liquid-glass rounded-2xl border border-black/20 bg-white/80 p-4">
          <label
            className="mb-2 block text-xs font-medium text-black/70"
            htmlFor="studio-model"
          >
            Modèle
          </label>
          <select
            className="mb-4 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-sm text-black"
            id="studio-model"
            onChange={(event) => setImageModel(event.target.value)}
            value={currentModel}
          >
            {imageModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>

          <label
            className="mb-2 block text-xs font-medium text-black/70"
            htmlFor="studio-prompt"
          >
            Prompt
          </label>
          <textarea
            className="min-h-44 w-full rounded-2xl border border-black/20 bg-white p-3 text-sm text-black"
            id="studio-prompt"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Décrivez précisément ce que vous voulez produire..."
            value={prompt}
          />
          <Button className="mt-2" onClick={enhancePrompt} size="sm" type="button" variant="outline">
            Optimiser le prompt
          </Button>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-black/70">Format de sortie</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "square", label: "Carré" },
                { id: "landscape", label: "Paysage" },
                { id: "portrait", label: "Portrait" },
                { id: "story", label: "Story" },
                { id: "custom", label: "Personnalisé" },
              ].map((item) => (
                <button
                  className={`rounded-xl border px-3 py-1.5 text-xs ${
                    outputPreset === item.id
                      ? "border-cyan-500/40 bg-cyan-100 text-black"
                      : "border-black/20 bg-white text-black/70"
                  }`}
                  key={item.id}
                  onClick={() => setOutputPreset(item.id as OutputPreset)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            {outputPreset === "custom" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  className="h-9 rounded-xl border border-black/20 bg-white px-2 text-xs"
                  min={256}
                  onChange={(event) => setCustomWidth(event.target.value)}
                  placeholder="Largeur"
                  type="number"
                  value={customWidth}
                />
                <input
                  className="h-9 rounded-xl border border-black/20 bg-white px-2 text-xs"
                  min={256}
                  onChange={(event) => setCustomHeight(event.target.value)}
                  placeholder="Hauteur"
                  type="number"
                  value={customHeight}
                />
              </div>
            )}
            <p className="mt-1 text-[11px] text-black/60">Taille active : {selectedSize}</p>
          </div>

          {mode === "edit-image" ? (
            <>
              <label
                className="mt-4 mb-2 block text-xs font-medium text-black/70"
                htmlFor="studio-import-source"
              >
                Image source
              </label>
              <select
                className="mb-2 h-9 w-full rounded-xl border border-black/20 bg-white px-3 text-xs text-black"
                id="studio-import-source"
                onChange={(event) =>
                  setImportSource(event.target.value as "device" | "mai-library")
                }
                value={importSource}
              >
                <option value="device">Source : appareil local</option>
                <option value="mai-library">Source : Bibliothèque mAI</option>
              </select>
              <label className="mb-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 bg-background/50 px-3 py-2 text-xs text-muted-foreground transition hover:bg-background/70">
                <Upload className="size-3.5" />
                {importSource === "device"
                  ? "Importer une image locale"
                  : "Sélection via Bibliothèque mAI"}
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={onImageFileChange}
                  type="file"
                />
              </label>
              <textarea
                className="min-h-20 w-full rounded-2xl border border-black/20 bg-white p-3 text-sm text-black"
                onChange={(event) => setImageInput(event.target.value)}
                placeholder="https://... ou data:image/..."
                value={imageInput}
              />
              <div className="mt-3 rounded-2xl border border-black/20 bg-white/80 p-3">
                <p className="mb-2 text-xs font-semibold text-black/70">
                  Éditeur intégré (rapide)
                </p>
                <div className="grid gap-2 text-xs">
                  <label>
                    Luminosité ({editorBrightness}%)
                    <input
                      className="w-full"
                      max={180}
                      min={40}
                      onChange={(event) =>
                        setEditorBrightness(Number(event.target.value))
                      }
                      type="range"
                      value={editorBrightness}
                    />
                  </label>
                  <label>
                    Contraste ({editorContrast}%)
                    <input
                      className="w-full"
                      max={180}
                      min={40}
                      onChange={(event) =>
                        setEditorContrast(Number(event.target.value))
                      }
                      type="range"
                      value={editorContrast}
                    />
                  </label>
                  <label>
                    Saturation ({editorSaturation}%)
                    <input
                      className="w-full"
                      max={220}
                      min={0}
                      onChange={(event) =>
                        setEditorSaturation(Number(event.target.value))
                      }
                      type="range"
                      value={editorSaturation}
                    />
                  </label>
                  <label>
                    Flou ({editorBlur}px)
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
                <Button
                  className="mt-2 w-full"
                  onClick={applyEditorAdjustments}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Appliquer les retouches
                </Button>
                <canvas className="hidden" ref={canvasRef} />
              </div>
            </>
          ) : null}

          <Button
            className="mt-4 w-full border border-black/20 bg-cyan-200 text-black hover:bg-cyan-300"
            disabled={
              isLoading ||
              !canConsumeUsage(
                "studio",
                "day",
                currentPlanDefinition?.limits?.studioImagesPerDay || 0
              )
            }
            onClick={runStudio}
          >
            {isLoading ? "Traitement..." : "Lancer la génération"}
          </Button>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
              <Button className="mt-2" onClick={copyError} size="sm" type="button" variant="outline">
                <Copy className="mr-1 size-3.5" /> Copier l&apos;erreur
              </Button>
            </div>
          ) : null}
        </div>

        <div className="liquid-glass rounded-2xl border border-black/20 bg-white/80 p-4">
          <p className="text-xs font-medium text-black/70">Résultat</p>
          <p className="mt-1 text-[11px] text-black/60">
            Fournisseur actif : {resultProvider || "en attente"}
          </p>

          {isLoading && (
            <div className="studio-loader mt-5">
              <div className="studio-loader__ring" />
              <div className="studio-loader__orbit">
                <span className="studio-loader__star">✦</span>
              </div>
            </div>
          )}

          {resultImage ? (
            /* biome-ignore lint/performance/noImgElement: generated image */
            <img
              alt="Résultat généré"
              className="mt-3 w-full rounded-2xl border border-border/40 object-cover"
              src={resultImage}
            />
          ) : null}

          {resultImage ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={runStudio} size="sm" type="button" variant="outline">
                <RefreshCw className="mr-1 size-3.5" /> Régénérer
              </Button>
              <Button
                onClick={() => {
                  setMode("edit-image");
                  setImageInput(resultImage);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <WandSparkles className="mr-1 size-3.5" /> Modifier / éditer
              </Button>
              <Button onClick={copyImage} size="sm" type="button" variant="outline">
                <Copy className="mr-1 size-3.5" /> Copier
              </Button>
              <Button onClick={downloadImage} size="sm" type="button" variant="outline">
                <Download className="mr-1 size-3.5" /> Télécharger
              </Button>
              <Button className="col-span-2" onClick={addToLibrary} size="sm" type="button" variant="outline">
                <Library className="mr-1 size-3.5" /> Ajouter à /library
              </Button>
            </div>
          ) : (
            <p className="mt-6 text-sm text-black/65">
              Le résultat s&apos;affichera ici après exécution.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
