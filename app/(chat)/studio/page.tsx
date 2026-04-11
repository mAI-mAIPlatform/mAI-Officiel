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
  const [outputFormat, setOutputFormat] = useState<"square" | "landscape">(
    "square"
  );

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
          size: outputFormat === "square" ? "1024x1024" : "1536x1024",
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Erreur de génération");
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
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-4 text-black md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Atelier visuel IA
          </h1>
          <p className="text-sm text-black/70">
            Génération et édition d'images avec une interface moderne.
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

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-black/70">
              Format de sortie
            </p>
            <div className="flex gap-2">
              {[
                { id: "square", label: "Carré" },
                { id: "landscape", label: "Paysage" },
              ].map((item) => (
                <button
                  className={`rounded-xl border px-3 py-1.5 text-xs ${
                    outputFormat === item.id
                      ? "border-cyan-500/40 bg-cyan-100 text-black"
                      : "border-black/20 bg-white text-black/70"
                  }`}
                  key={item.id}
                  onClick={() =>
                    setOutputFormat(item.id as "square" | "landscape")
                  }
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
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
            disabled={isLoading}
            onClick={runStudio}
          >
            {isLoading ? "Traitement..." : "Lancer la génération"}
          </Button>
          {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        </div>

        <div className="liquid-glass rounded-2xl border border-black/20 bg-white/80 p-4">
          <p className="text-xs font-medium text-black/70">Résultat</p>
          <p className="mt-1 text-[11px] text-black/60">
            Fournisseur actif : {resultProvider || "en attente"}
          </p>

          {resultImage ? (
            <img
              alt="Résultat généré"
              className="mt-3 w-full rounded-2xl border border-border/40 object-cover"
              src={resultImage}
            />
          ) : null}

          {resultImage ? null : (
            <p className="mt-6 text-sm text-black/65">
              Le résultat s'affichera ici après exécution.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
