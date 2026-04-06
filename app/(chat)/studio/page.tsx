"use client";

import { ImagePlus, Upload, WandSparkles } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { affordableImageModels } from "@/lib/ai/affordable-models";

const imageModels = affordableImageModels;

type StudioMode = "generate-image" | "edit-image";

export default function StudioPage() {
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

  const currentModel = imageModel;

  const onImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    setIsLoading(true);
    setError("");
    setResultImage("");

    try {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          model: currentModel,
          prompt,
          image: mode === "edit-image" ? imageInput : undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Erreur Studio");
      }

      setResultProvider(payload.provider ?? "provider inconnu");

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

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studio IA</h1>
          <p className="text-sm text-muted-foreground">
            Génération et édition d'images avec interface Liquid Glass.
          </p>
        </div>
        <div className="flex gap-2 rounded-2xl border border-border/60 bg-background/40 p-1 backdrop-blur-xl">
          {[
            { id: "generate-image", label: "Image", icon: ImagePlus },
            { id: "edit-image", label: "Édition", icon: WandSparkles },
          ].map((item) => (
            <button
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition ${
                mode === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
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
        <div className="liquid-glass rounded-2xl border border-border/60 bg-card/70 p-4">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Modèle
          </label>
          <select
            className="mb-4 h-10 w-full rounded-xl border border-border/40 bg-background/70 px-3 text-sm"
            onChange={(event) => setImageModel(event.target.value)}
            value={currentModel}
          >
            {imageModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>

          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Prompt
          </label>
          <textarea
            className="min-h-44 w-full rounded-2xl border border-border/40 bg-background/70 p-3 text-sm"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Décrivez précisément ce que vous voulez produire..."
            value={prompt}
          />

          {mode === "edit-image" ? (
            <>
              <label className="mt-4 mb-2 block text-xs font-medium text-muted-foreground">
                Image source (import conseillé)
              </label>
              <select
                className="mb-2 h-9 w-full rounded-xl border border-border/40 bg-background/70 px-3 text-xs"
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
                className="min-h-24 w-full rounded-2xl border border-border/40 bg-background/70 p-3 text-sm"
                onChange={(event) => setImageInput(event.target.value)}
                placeholder="https://... ou data:image/... (auto-rempli après import)"
                value={imageInput}
              />
            </>
          ) : null}

          <Button
            className="mt-4 w-full"
            disabled={isLoading}
            onClick={runStudio}
          >
            {isLoading ? "Traitement..." : "Lancer dans Studio"}
          </Button>
          {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        </div>

        <div className="liquid-glass rounded-2xl border border-border/60 bg-card/70 p-4">
          <p className="text-xs font-medium text-muted-foreground">Résultat</p>
          <p className="mt-1 text-[11px] text-muted-foreground/80">
            Fournisseur actif : {resultProvider || "en attente"}
          </p>

          {resultImage ? (
            <img
              alt="Résultat Studio"
              className="mt-3 w-full rounded-2xl border border-border/40 object-cover"
              src={resultImage}
            />
          ) : null}

          {resultImage ? null : (
            <p className="mt-6 text-sm text-muted-foreground">
              Le résultat s'affichera ici après exécution.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
