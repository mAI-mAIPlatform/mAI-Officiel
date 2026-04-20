"use client";

import { Copy, Download, ExternalLink, ImagePlus, Upload, WandSparkles } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { affordableImageModels } from "@/lib/ai/affordable-models";
import { canConsumeUsage, consumeUsage, getUsageCount } from "@/lib/usage-limits";

const imageModels = affordableImageModels;

type StudioMode = "generate-image" | "edit-image";
type QualityLevel = "eco" | "standard" | "high";
type OutputFormat = "png" | "jpeg" | "webp";
type SizePreset = "1024x1024" | "768x1024" | "1536x1024" | "1024x576";

const STUDIO_DAILY_LIMITS = {
  free: 5,
  plus: 10,
  pro: 20,
  max: Number.POSITIVE_INFINITY,
} as const;

const SIZE_OPTIONS: Array<{ label: string; value: SizePreset }> = [
  { value: "1024x1024", label: "Carré (1:1)" },
  { value: "768x1024", label: "Portrait (3:4)" },
  { value: "1536x1024", label: "Paysage (3:2)" },
  { value: "1024x576", label: "Bannière (16:9)" },
];

async function sleep(milliseconds: number) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Téléchargement de l'image impossible.");
  }
  return response.blob();
}

async function convertBlobToFormat(blob: Blob, format: OutputFormat): Promise<Blob> {
  if (format === "png") {
    return blob;
  }

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");

  if (!context) {
    return blob;
  }

  context.drawImage(bitmap, 0, 0);
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/webp";

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (outputBlob) => {
        if (!outputBlob) {
          reject(new Error("Conversion de format impossible."));
          return;
        }
        resolve(outputBlob);
      },
      mimeType,
      0.95
    );
  });
}

export default function StudioPage() {
  const { isHydrated, plan } = useSubscriptionPlan();
  const [mode, setMode] = useState<StudioMode>("generate-image");
  const [prompt, setPrompt] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageModel, setImageModel] = useState(imageModels[0]?.id ?? "");
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [resultStatus, setResultStatus] = useState("");
  const [imagesToday, setImagesToday] = useState(0);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [importSource, setImportSource] = useState<"device" | "mai-library">(
    "device"
  );
  const [quality, setQuality] = useState<QualityLevel>("standard");
  const [quantity, setQuantity] = useState(1);
  const [sizePreset, setSizePreset] = useState<SizePreset>("1024x1024");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");

  const dailyLimit = STUDIO_DAILY_LIMITS[plan];
  const hasUnlimitedStudio = !Number.isFinite(dailyLimit);
  const remainingImages = hasUnlimitedStudio
    ? Number.POSITIVE_INFINITY
    : Math.max(dailyLimit - imagesToday, 0);
  const currentModel = imageModel;

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    setImagesToday(getUsageCount("studio", "day"));
  }, [isHydrated]);

  const canRun = useMemo(() => {
    if (!isHydrated) return false;
    if (hasUnlimitedStudio) return true;
    return quantity <= remainingImages;
  }, [hasUnlimitedStudio, isHydrated, quantity, remainingImages]);

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

  const consumeStudioUsage = (amount: number) => {
    let lastCount = imagesToday;
    for (let index = 0; index < amount; index += 1) {
      const usage = consumeUsage("studio", "day");
      lastCount = usage.count;
    }
    setImagesToday(lastCount);
  };

  const runStudio = async () => {
    if (!prompt.trim()) {
      setError("Veuillez saisir un prompt.");
      return;
    }

    if (!hasUnlimitedStudio && !canConsumeUsage("studio", "day", dailyLimit)) {
      setError(
        `Quota Studio atteint (${dailyLimit}/jour). Passez au forfait supérieur ou réessayez demain.`
      );
      return;
    }

    if (!hasUnlimitedStudio && quantity > remainingImages) {
      setError(
        `Vous pouvez encore générer ${remainingImages} image${remainingImages > 1 ? "s" : ""} aujourd'hui avec votre forfait.`
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setResultImages([]);
    setResultStatus("Lancement de la génération…");

    try {
      const response = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          model: currentModel,
          prompt,
          image: mode === "edit-image" ? imageInput : undefined,
          quality,
          quantity,
          size: sizePreset,
        }),
      });

      const payload = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Erreur de génération");
      }

      if (!payload.id) {
        throw new Error("Réponse génération invalide: identifiant introuvable.");
      }

      const maxAttempts = 50;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const statusResponse = await fetch(`/api/studio/result/${payload.id}`, {
          cache: "no-store",
        });
        const statusPayload = (await statusResponse.json()) as {
          error?: string;
          images?: string[];
          message?: string;
          status?: "done" | "processing";
        };

        if (!statusResponse.ok) {
          throw new Error(statusPayload.error ?? "Erreur pendant le suivi du rendu.");
        }

        if (statusPayload.status === "done" && (statusPayload.images?.length ?? 0) > 0) {
          const images = statusPayload.images ?? [];
          setResultImages(images);
          setResultStatus(`Génération terminée ✅ (${images.length} image${images.length > 1 ? "s" : ""})`);
          consumeStudioUsage(images.length);
          break;
        }

        if (statusPayload.status === "done") {
          throw new Error(
            statusPayload.message ?? "La génération est terminée sans image exploitable."
          );
        }

        setResultStatus(statusPayload.message ?? "Image en cours de génération ⏳");

        if (attempt === maxAttempts - 1) {
          throw new Error("Délai dépassé: génération toujours en cours.");
        }

        await sleep(2000);
      }
    } catch (runError) {
      setResultStatus("");
      setError(
        runError instanceof Error ? runError.message : "Erreur inconnue"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setSuccessMessage("Prompt copié ✅");
    } catch {
      setError("Impossible de copier le prompt.");
    }
  };

  const handleCopyImageLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setSuccessMessage("Lien copié ✅");
    } catch {
      setError("Impossible de copier le lien de l'image.");
    }
  };

  const handleCopyImage = async (url: string) => {
    try {
      const blob = await convertBlobToFormat(await urlToBlob(url), outputFormat);
      const mimeType =
        outputFormat === "jpeg"
          ? "image/jpeg"
          : outputFormat === "webp"
            ? "image/webp"
            : "image/png";
      await navigator.clipboard.write([
        new ClipboardItem({
          [mimeType]: blob,
        }),
      ]);
      setSuccessMessage("Image copiée ✅");
    } catch {
      setError("Copie image non disponible sur ce navigateur.");
    }
  };

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      const convertedBlob = await convertBlobToFormat(await urlToBlob(url), outputFormat);
      const objectUrl = URL.createObjectURL(convertedBlob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `studio-${Date.now()}-${index + 1}.${outputFormat}`;
      link.click();
      URL.revokeObjectURL(objectUrl);
      setSuccessMessage("Téléchargement lancé ✅");
    } catch {
      setError("Impossible de télécharger l'image.");
    }
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-4 text-black md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Atelier visuel IA
          </h1>
          <p className="text-sm text-black/70">
            Génération et édition d&apos;images avec une interface moderne.
          </p>
          <p className="mt-1 text-xs text-black/60">
            Quota Studio : {imagesToday}/
            {hasUnlimitedStudio ? "∞" : dailyLimit} image
            {hasUnlimitedStudio || dailyLimit > 1 ? "s" : ""} aujourd&apos;hui
            {!hasUnlimitedStudio
              ? ` (${remainingImages} restante${remainingImages > 1 ? "s" : ""})`
              : " (illimité avec Max)"}.
          </p>
        </div>
        <div className="flex gap-2 rounded-2xl border border-black/20 bg-white/70 p-1 backdrop-blur-xl">
          {[
            { id: "generate-image", label: "Image", icon: ImagePlus },
            { id: "edit-image", label: "Édition", icon: WandSparkles },
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
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="rounded-full border border-black/20 bg-white px-3 py-1 text-xs text-black/75 hover:bg-cyan-50"
              onClick={handleCopyPrompt}
              type="button"
            >
              <Copy className="mr-1 inline size-3.5" />
              Copier le prompt
            </button>
            {[
              "Maquette UI liquid glass, texte noir, haute lisibilité",
              "Illustration produit isométrique, fond clair",
              "Avatar minimaliste style startup moderne",
            ].map((preset) => (
              <button
                className="rounded-full border border-black/20 bg-white px-3 py-1 text-xs text-black/75 hover:bg-cyan-50"
                key={preset}
                onClick={() => setPrompt(preset)}
                type="button"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-medium text-black/70">
              Nombre d&apos;images
              <input
                className="mt-1 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-sm text-black"
                max={4}
                min={1}
                onChange={(event) =>
                  setQuantity(Math.min(4, Math.max(1, Number(event.target.value) || 1)))
                }
                type="number"
                value={quantity}
              />
            </label>

            <label className="text-xs font-medium text-black/70">
              Qualité
              <select
                className="mt-1 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-sm text-black"
                onChange={(event) => setQuality(event.target.value as QualityLevel)}
                value={quality}
              >
                <option value="eco">Éco (rapide)</option>
                <option value="standard">Standard</option>
                <option value="high">Haute qualité</option>
              </select>
            </label>

            <label className="text-xs font-medium text-black/70">
              Taille / orientation
              <select
                className="mt-1 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-sm text-black"
                onChange={(event) => setSizePreset(event.target.value as SizePreset)}
                value={sizePreset}
              >
                {SIZE_OPTIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-black/70">
              Format de sortie
              <select
                className="mt-1 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-sm text-black"
                onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
                value={outputFormat}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WEBP</option>
              </select>
            </label>
          </div>

          {mode === "edit-image" ? (
            <>
              <label
                className="mt-4 mb-2 block text-xs font-medium text-black/70"
                htmlFor="studio-import-source"
              >
                Image source (import conseillé)
              </label>
              <select
                className="mb-2 h-9 w-full rounded-xl border border-black/20 bg-white px-3 text-xs text-black"
                id="studio-import-source"
                onChange={(event) =>
                  setImportSource(
                    event.target.value as "device" | "mai-library"
                  )
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
                className="min-h-24 w-full rounded-2xl border border-black/20 bg-white p-3 text-sm text-black"
                onChange={(event) => setImageInput(event.target.value)}
                placeholder="https://... ou data:image/... (auto-rempli après import)"
                value={imageInput}
              />
            </>
          ) : null}

          <Button
            className="mt-4 w-full border border-black/20 bg-cyan-200 text-black hover:bg-cyan-300"
            disabled={isLoading || !canRun}
            onClick={runStudio}
          >
            {isLoading ? "Traitement..." : "Lancer la génération"}
          </Button>

          {successMessage ? (
            <p className="mt-3 text-sm text-green-600">{successMessage}</p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        </div>

        <div className="liquid-glass rounded-2xl border border-black/20 bg-white/80 p-4">
          <p className="text-xs font-medium text-black/70">Résultat</p>
          {resultStatus ? (
            <p className="mt-1 text-[11px] text-black/60">{resultStatus}</p>
          ) : null}

          {resultImages.length > 0 ? (
            <div className="mt-3 grid gap-3">
              {resultImages.map((imageUrl, index) => (
                <div className="rounded-2xl border border-border/40 p-2" key={`${imageUrl}-${index}`}>
                  <img
                    alt={`Résultat généré ${index + 1}`}
                    className="w-full rounded-xl object-cover"
                    src={imageUrl}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      className="rounded-lg border border-black/20 px-2 py-1 text-[11px] text-black/75 hover:bg-cyan-50"
                      onClick={() => handleCopyImage(imageUrl)}
                      type="button"
                    >
                      <Copy className="mr-1 inline size-3.5" />
                      Copier
                    </button>
                    <button
                      className="rounded-lg border border-black/20 px-2 py-1 text-[11px] text-black/75 hover:bg-cyan-50"
                      onClick={() => handleDownloadImage(imageUrl, index)}
                      type="button"
                    >
                      <Download className="mr-1 inline size-3.5" />
                      Télécharger
                    </button>
                    <button
                      className="rounded-lg border border-black/20 px-2 py-1 text-[11px] text-black/75 hover:bg-cyan-50"
                      onClick={() => handleCopyImageLink(imageUrl)}
                      type="button"
                    >
                      Lien
                    </button>
                    <a
                      className="rounded-lg border border-black/20 px-2 py-1 text-[11px] text-black/75 hover:bg-cyan-50"
                      href={imageUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="mr-1 inline size-3.5" />
                      Ouvrir
                    </a>
                  </div>
                </div>
              ))}
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
