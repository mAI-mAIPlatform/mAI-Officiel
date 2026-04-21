"use client";

import {
  Download,
  Heart,
  Library,
  Music2,
  Pin,
  Plus,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { canConsumeUsage, consumeUsage, getUsageCount } from "@/lib/usage-limits";

type WaveModel = "V5_5" | "V5" | "V4_5PLUS" | "V4_5ALL" | "V4_5" | "V4";
type Gender = "m" | "f" | "n";
type MusicDownloadFormat = "source" | "wav" | "json";

type WaveTrack = {
  id: string;
  createdAt: string;
  title: string;
  prompt: string;
  style: string;
  model: WaveModel;
  instrumental: boolean;
  apiResponse: unknown;
  favorite: boolean;
  pinned: boolean;
  inLibrary: boolean;
  audioUrl?: string;
};

const HISTORY_KEY = "mai.wave.history.v1";
const LIBRARY_KEY = "mai.library.assets";
const WAVE_DRAFTS_KEY = "mai.wave.prefill.prompts.v1";

const modelDescriptions: Record<WaveModel, string> = {
  V5_5: "Libérez votre voix : des modèles personnalisés adaptés à vos goûts uniques.",
  V5: "Expression musicale supérieure, génération plus rapide.",
  V4_5PLUS: "V4.5+ est un son plus riche, de nouvelles façons de créer, max 8 minutes.",
  V4_5ALL:
    "V4.5 All - tout est une meilleure structure de chanson, max 8 min.",
  V4_5:
    "Mélange de genres supérieur avec des prompts plus intelligents et une production plus rapide, jusqu’à 8 minutes.",
  V4: "Meilleure qualité audio avec une structure de chanson raffinée, jusqu’à 4 minutes.",
};

export default function WavePage() {
  const { currentPlanDefinition } = useSubscriptionPlan();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("");
  const [negativeTags, setNegativeTags] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [personaModel, setPersonaModel] = useState("style_persona");
  const [model, setModel] = useState<WaveModel>("V4_5ALL");
  const [instrumental, setInstrumental] = useState(true);
  const [vocalGender, setVocalGender] = useState<Gender>("n");
  const [styleWeight, setStyleWeight] = useState(0.65);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState(0.65);
  const [audioWeight, setAudioWeight] = useState(0.65);
  const [isLoading, setIsLoading] = useState(false);
  const [lyricsPrompt, setLyricsPrompt] = useState("");
  const [generatedLyrics, setGeneratedLyrics] = useState("");
  const [history, setHistory] = useState<WaveTrack[]>([]);
  const [downloadFormatByTrack, setDownloadFormatByTrack] = useState<
    Record<string, MusicDownloadFormat>
  >({});

  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem(HISTORY_KEY);
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
      const rawDrafts = localStorage.getItem(WAVE_DRAFTS_KEY);
      if (rawDrafts) {
        const drafts = JSON.parse(rawDrafts) as string[];
        if (Array.isArray(drafts) && drafts[0]) {
          setPrompt((prev) => prev || drafts[0] || "");
        }
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const weeklyUsed = getUsageCount("wave", "week");
  const weeklyLimit = currentPlanDefinition.limits.musicGenerationsPerWeek;
  const weeklyRemaining = Math.max(0, weeklyLimit - weeklyUsed);

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          +new Date(b.createdAt) - +new Date(a.createdAt)
      ),
    [history]
  );

  const extractAudioUrl = (payload: unknown): string | undefined => {
    if (!payload || typeof payload !== "object") return undefined;
    const values = Object.values(payload as Record<string, unknown>);
    for (const value of values) {
      if (typeof value === "string" && value.startsWith("http") && value.includes("mp3")) {
        return value;
      }
      if (value && typeof value === "object") {
        const nested = extractAudioUrl(value);
        if (nested) return nested;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          const nested = extractAudioUrl(item);
          if (nested) return nested;
        }
      }
    }
    return undefined;
  };

  const handleGenerateLyrics = async () => {
    if (!lyricsPrompt.trim()) {
      toast.error("Ajoutez un brief pour générer les lyrics.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/wave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lyrics",
          prompt: lyricsPrompt,
          style,
          mood: negativeTags,
          language: "français",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Erreur lyrics");
      setGeneratedLyrics(payload.text || "");
      setPrompt((prev) => `${prev}\n\n${payload.text || ""}`.trim());
      toast.success("Lyrics générées avec GPT-5.4 Nano.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lyrics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour générer de la musique.");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Le prompt est requis.");
      return;
    }
    if (!canConsumeUsage("wave", "week", weeklyLimit, 1)) {
      toast.error("Quota hebdomadaire Wave atteint pour votre forfait.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/wave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          customMode: true,
          instrumental,
          model,
          callBackUrl: callbackUrl,
          prompt,
          style,
          title,
          personaId,
          personaModel,
          negativeTags,
          vocalGender,
          styleWeight,
          weirdnessConstraint,
          audioWeight,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Génération impossible");
      }

      consumeUsage("wave", "week");
      const audioUrl = extractAudioUrl(payload.data);
      const entry: WaveTrack = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        title: title.trim() || `Wave ${new Date().toLocaleString("fr-FR")}`,
        prompt,
        style,
        model,
        instrumental,
        apiResponse: payload,
        favorite: false,
        pinned: false,
        inLibrary: false,
        audioUrl,
      };
      setHistory((prev) => [entry, ...prev]);
      toast.success("Musique générée et enregistrée dans l'historique Wave.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur Wave");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTrack = (id: string, updater: (track: WaveTrack) => WaveTrack) => {
    setHistory((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const addToLibrary = (track: WaveTrack) => {
    try {
      const raw = localStorage.getItem(LIBRARY_KEY);
      const current = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
      current.unshift({
        id: track.id,
        name: track.title,
        type: "document",
        pinned: track.pinned,
        favorite: track.favorite,
        url: track.audioUrl ?? `data:text/plain,${encodeURIComponent(track.prompt)}`,
        createdAt: track.createdAt,
      });
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(current));
      updateTrack(track.id, (item) => ({ ...item, inLibrary: true }));
      toast.success("Ajouté à la bibliothèque.");
    } catch {
      toast.error("Impossible d'ajouter à la bibliothèque.");
    }
  };

  const encodeWav = (audioBuffer: AudioBuffer): Blob => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.length;
    const blockAlign = numberOfChannels * 2;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeString = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i += 1) {
        view.setUint8(offset + i, value.charCodeAt(i));
      }
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);
    let offset = 44;
    for (let i = 0; i < samples; i += 1) {
      for (let channel = 0; channel < numberOfChannels; channel += 1) {
        const sample = audioBuffer.getChannelData(channel)[i] ?? 0;
        const s = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([buffer], { type: "audio/wav" });
  };

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadTrack = async (track: WaveTrack) => {
    const format = downloadFormatByTrack[track.id] ?? "source";
    try {
      if (format === "json") {
        const payload = JSON.stringify(track.apiResponse, null, 2);
        triggerBlobDownload(
          new Blob([payload], { type: "application/json" }),
          `${track.title || "wave-track"}.json`
        );
        return;
      }

      if (!track.audioUrl) {
        throw new Error("Aucun lien audio disponible pour ce morceau.");
      }

      const response = await fetch(track.audioUrl);
      if (!response.ok) {
        throw new Error("Téléchargement du flux audio impossible.");
      }
      const sourceBlob = await response.blob();

      if (format === "source") {
        const extension =
          sourceBlob.type.split("/")[1] ||
          track.audioUrl.split(".").pop() ||
          "mp3";
        triggerBlobDownload(sourceBlob, `${track.title || "wave-track"}.${extension}`);
        return;
      }

      const arrayBuffer = await sourceBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      const wavBlob = encodeWav(audioBuffer);
      triggerBlobDownload(wavBlob, `${track.title || "wave-track"}.wav`);
      await audioContext.close();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Téléchargement impossible."
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
      <header className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Music2 className="size-6 text-primary" /> Wave
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Générez des musiques avec SUNO, personnalisez à fond, créez des lyrics avec GPT-5.4 Nano et gardez un historique complet.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Quota hebdomadaire: {weeklyUsed}/{weeklyLimit} ({weeklyRemaining} restant)
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
          <h2 className="text-lg font-semibold">Génération musicale</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="rounded-md border bg-background/70 p-2" placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="rounded-md border bg-background/70 p-2" value={model} onChange={(e) => setModel(e.target.value as WaveModel)}>
              {(Object.keys(modelDescriptions) as WaveModel[]).map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
            <input className="rounded-md border bg-background/70 p-2 md:col-span-2" placeholder="Style musical" value={style} onChange={(e) => setStyle(e.target.value)} />
            <textarea className="min-h-24 rounded-md border bg-background/70 p-2 md:col-span-2" placeholder="Prompt musical détaillé" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <textarea className="min-h-20 rounded-md border bg-background/70 p-2 md:col-span-2" placeholder="Negative tags" value={negativeTags} onChange={(e) => setNegativeTags(e.target.value)} />
            <input className="rounded-md border bg-background/70 p-2" placeholder="Persona ID" value={personaId} onChange={(e) => setPersonaId(e.target.value)} />
            <input className="rounded-md border bg-background/70 p-2" placeholder="Persona model" value={personaModel} onChange={(e) => setPersonaModel(e.target.value)} />
            <input className="rounded-md border bg-background/70 p-2 md:col-span-2" placeholder="Callback URL" value={callbackUrl} onChange={(e) => setCallbackUrl(e.target.value)} />
            <label className="flex items-center gap-2 text-sm"><input checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} type="checkbox" /> Instrumental</label>
            <select className="rounded-md border bg-background/70 p-2" value={vocalGender} onChange={(e) => setVocalGender(e.target.value as Gender)}>
              <option value="n">Neutre</option><option value="m">Voix masculine</option><option value="f">Voix féminine</option>
            </select>
            <label className="text-xs">Style weight {styleWeight.toFixed(2)}<input className="w-full" type="range" min={0} max={1} step={0.01} value={styleWeight} onChange={(e) => setStyleWeight(Number(e.target.value))} /></label>
            <label className="text-xs">Weirdness {weirdnessConstraint.toFixed(2)}<input className="w-full" type="range" min={0} max={1} step={0.01} value={weirdnessConstraint} onChange={(e) => setWeirdnessConstraint(Number(e.target.value))} /></label>
            <label className="text-xs md:col-span-2">Audio weight {audioWeight.toFixed(2)}<input className="w-full" type="range" min={0} max={1} step={0.01} value={audioWeight} onChange={(e) => setAudioWeight(Number(e.target.value))} /></label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{modelDescriptions[model]}</p>
          <Button className="mt-4" disabled={isLoading} onClick={handleGenerateMusic}><Sparkles className="mr-2 size-4" />{isLoading ? "Génération..." : "Générer la musique"}</Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
          <h2 className="text-lg font-semibold">Assistant lyrics</h2>
          <textarea className="mt-3 min-h-24 w-full rounded-md border bg-background/70 p-2" placeholder="Sujet, émotion, thème..." value={lyricsPrompt} onChange={(e) => setLyricsPrompt(e.target.value)} />
          <Button className="mt-3" disabled={isLoading} onClick={handleGenerateLyrics} variant="outline"><WandSparkles className="mr-2 size-4" />Générer les lyrics (GPT-5.4 Nano)</Button>
          <textarea className="mt-3 min-h-52 w-full rounded-md border bg-background/70 p-2" placeholder="Lyrics générées" value={generatedLyrics} onChange={(e) => setGeneratedLyrics(e.target.value)} />
          <Button className="mt-3" onClick={() => setPrompt((prev) => `${prev}\n\n${generatedLyrics}`.trim())} variant="ghost"><Plus className="mr-2 size-4" />Ajouter au prompt musical</Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-5">
        <h2 className="text-lg font-semibold">Historique Wave</h2>
        <div className="mt-4 space-y-3">
          {sortedHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune musique générée pour le moment.</p>
          ) : (
            sortedHistory.map((track) => (
              <article className="rounded-xl border border-border/50 bg-background/60 p-3" key={track.id}>
                <input className="w-full bg-transparent text-sm font-semibold" value={track.title} onChange={(e) => updateTrack(track.id, (current) => ({ ...current, title: e.target.value }))} />
                <p className="mt-1 text-xs text-muted-foreground">{track.model} • {new Date(track.createdAt).toLocaleString("fr-FR")}</p>
                <p className="mt-2 text-sm">{track.prompt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => updateTrack(track.id, (current) => ({ ...current, favorite: !current.favorite }))} size="sm" variant="outline"><Heart className="mr-1 size-4" />{track.favorite ? "Retirer favori" : "Favori"}</Button>
                  <Button onClick={() => updateTrack(track.id, (current) => ({ ...current, pinned: !current.pinned }))} size="sm" variant="outline"><Pin className="mr-1 size-4" />{track.pinned ? "Désépingler" : "Épingler"}</Button>
                  <Button onClick={() => addToLibrary(track)} size="sm" variant="outline"><Library className="mr-1 size-4" />{track.inLibrary ? "Déjà en bibliothèque" : "Ajouter à la bibliothèque"}</Button>
                  <select
                    className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs"
                    onChange={(event) =>
                      setDownloadFormatByTrack((current) => ({
                        ...current,
                        [track.id]: event.target.value as MusicDownloadFormat,
                      }))
                    }
                    value={downloadFormatByTrack[track.id] ?? "source"}
                  >
                    <option value="source">Audio source</option>
                    <option value="wav">WAV</option>
                    <option value="json">JSON (métadonnées)</option>
                  </select>
                  <Button onClick={() => downloadTrack(track)} size="sm" variant="outline">
                    <Download className="mr-1 size-4" />Télécharger
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
