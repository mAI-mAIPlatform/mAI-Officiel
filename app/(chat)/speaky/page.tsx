"use client";

import {
  Download,
  Gauge,
  LibraryBig,
  Loader2,
  Play,
  Sparkles,
  Square,
  Volume,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type SpeakyResponse = {
  audioBase64: string;
  contentType: string;
  durationEstimateSec: number;
  provider: string;
  selectedVoice?: string;
  suggestedVoices?: string[];
};

type VoiceStyle = "narratif" | "conversationnel" | "énergique";

const LANGUAGE_OPTIONS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "tr", label: "Türkçe" },
  { code: "sv", label: "Svenska" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
] as const;

const VOICES_BY_LANGUAGE: Record<string, string[]> = {
  ar: ["Zeina", "Hala"],
  de: ["Marlene", "Vicki", "Hans"],
  en: ["Brian", "Joanna", "Matthew", "Amy"],
  es: ["Conchita", "Enrique", "Lucia"],
  fr: ["Lea", "Mathieu", "Celine"],
  hi: ["Aditi"],
  it: ["Carla", "Bianca", "Giorgio"],
  ja: ["Mizuki", "Takumi"],
  ko: ["Seoyeon"],
  nl: ["Lotte", "Ruben"],
  pl: ["Ewa", "Maja", "Jacek"],
  pt: ["Camila", "Vitoria", "Ricardo"],
  ru: ["Tatyana", "Maxim"],
  sv: ["Astrid"],
  tr: ["Filiz"],
  zh: ["Zhiyu"],
};

function generateWaveBars(seed = 24) {
  return Array.from({ length: seed }, (_, index) => index);
}

function getEffectiveRate(rate: number, tone: number) {
  return Math.max(0.6, Math.min(2, rate * 2 ** (tone / 12)));
}

export default function SpeakyPage() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("fr");
  const [voice, setVoice] = useState("Lea");
  const [rate, setRate] = useState(1);
  const [tone, setTone] = useState(0);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>("narratif");
  const [voiceGender, setVoiceGender] = useState<"homme" | "femme">("femme");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(
    null
  );
  const [provider, setProvider] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef("");
  const bars = useMemo(() => generateWaveBars(), []);
  const cloudTextLength = text.trim().length;
  const availableVoices = useMemo(
    () => VOICES_BY_LANGUAGE[language] ?? VOICES_BY_LANGUAGE.fr,
    [language]
  );
  const effectiveRate = useMemo(
    () => getEffectiveRate(rate, tone),
    [rate, tone]
  );
  const speechSupport =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    if (!availableVoices.includes(voice)) {
      setVoice(availableVoices[0]);
    }
  }, [availableVoices, voice]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.playbackRate = effectiveRate;
    audioRef.current.preservesPitch = false;
  }, [effectiveRate]);

  const generateCloudAudio = async () => {
    if (!text.trim()) {
      toast.error("Ajoutez un texte avant de générer l'audio.");
      return;
    }

    if (cloudTextLength > 500) {
      toast.error("Mode cloud limité à 500 caractères par génération.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/speaky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language,
          voice,
          voiceStyle,
          voiceGender,
        }),
      });

      const payload = (await response.json()) as SpeakyResponse & {
        error?: string;
      };
      if (!response.ok || !payload.audioBase64) {
        throw new Error(payload.error ?? "Génération audio impossible");
      }

      const bytes = Uint8Array.from(atob(payload.audioBase64), (char) =>
        char.charCodeAt(0)
      );
      const blob = new Blob([bytes], {
        type: payload.contentType || "audio/mpeg",
      });
      const nextUrl = URL.createObjectURL(blob);

      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
      currentAudioUrlRef.current = nextUrl;

      setAudioUrl(nextUrl);
      setEstimatedDuration(payload.durationEstimateSec);
      setProvider(payload.provider);
      if (payload.selectedVoice) {
        setVoice(payload.selectedVoice);
      }

      toast.success("Audio cloud généré avec succès.");

      setTimeout(() => {
        audioRef.current?.play().catch(() => {
          // Ignore autoplay restrictions.
        });
      }, 10);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de génération audio"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const previewWithBrowserSpeech = () => {
    if (!text.trim()) {
      toast.error("Ajoutez du texte pour la prévisualisation.");
      return;
    }

    if (!speechSupport) {
      toast.error("Web Speech API indisponible sur ce navigateur.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.5, Math.min(1.8, rate));
    utterance.pitch = Math.max(0, Math.min(2, 1 + tone / 10));
    utterance.lang = `${language}-${language.toUpperCase()}`;
    utterance.volume = 1;

    const styleBoost =
      voiceStyle === "énergique"
        ? 0.12
        : voiceStyle === "conversationnel"
          ? 0.04
          : 0;
    utterance.rate = Math.max(0.5, Math.min(2, utterance.rate + styleBoost));

    const selectedVoice = window.speechSynthesis
      .getVoices()
      .find((candidate) =>
        candidate.lang.toLowerCase().startsWith(language.toLowerCase())
      );
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownload = () => {
    if (!audioUrl) {
      toast.error("Aucun audio à télécharger.");
      return;
    }

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `speaky-${Date.now()}.mp3`;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const saveToLibrary = async () => {
    if (!audioUrl) {
      toast.error("Générez d'abord un audio.");
      return;
    }

    const response = await fetch(audioUrl);
    const blob = await response.blob();
    const file = new File([blob], `speaky-${Date.now()}.mp3`, {
      type: "audio/mpeg",
    });

    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const payload = (await uploadResponse.json()) as { error?: string };
      toast.error(payload.error ?? "Échec de l'ajout à la bibliothèque");
      return;
    }

    toast.success("Audio ajouté à la bibliothèque.");
  };

  return (
    <div className="liquid-glass flex h-full flex-col gap-4 overflow-auto p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Speaky</h1>
          <p className="text-sm text-muted-foreground">
            Faire des sons d'exceptions.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <section className="liquid-panel space-y-3 rounded-2xl p-4">
          <textarea
            className="min-h-[280px] w-full rounded-xl border border-border/40 bg-background/70 p-3 text-sm"
            onChange={(event) => setText(event.target.value)}
            placeholder="Collez le texte à transformer en audio..."
            value={text}
          />

          <p className="text-[11px] text-muted-foreground">
            Limite cloud: 500 caractères ({cloudTextLength}/500).
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs">
              Langue
              <select
                className="mt-1 w-full rounded-lg border border-border/50 bg-background px-2 py-2 text-xs"
                onChange={(event) => setLanguage(event.target.value)}
                value={language}
              >
                {LANGUAGE_OPTIONS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs">
              Voix
              <select
                className="mt-1 w-full rounded-lg border border-border/50 bg-background px-2 py-2 text-xs"
                onChange={(event) => setVoice(event.target.value)}
                value={voice}
              >
                {availableVoices.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs">
              Style
              <select
                className="mt-1 w-full rounded-lg border border-border/50 bg-background px-2 py-2 text-xs"
                onChange={(event) =>
                  setVoiceStyle(event.target.value as VoiceStyle)
                }
                value={voiceStyle}
              >
                <option value="narratif">Narratif</option>
                <option value="conversationnel">Conversationnel</option>
                <option value="énergique">Énergique</option>
              </select>
            </label>
            <label className="text-xs">
              Variante
              <select
                className="mt-1 w-full rounded-lg border border-border/50 bg-background px-2 py-2 text-xs"
                onChange={(event) =>
                  setVoiceGender(event.target.value as "homme" | "femme")
                }
                value={voiceGender}
              >
                <option value="femme">Femme</option>
                <option value="homme">Homme</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs">
              Vitesse ({rate.toFixed(2)}x)
              <input
                className="mt-1 w-full"
                max={1.6}
                min={0.7}
                onChange={(event) => setRate(Number(event.target.value))}
                step={0.05}
                type="range"
                value={rate}
              />
            </label>

            <label className="text-xs">
              Ton ({tone > 0 ? `+${tone}` : tone})
              <input
                className="mt-1 w-full"
                max={6}
                min={-6}
                onChange={(event) => setTone(Number(event.target.value))}
                step={1}
                type="range"
                value={tone}
              />
            </label>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Vitesse/ton appliqués au playback (taux effectif:{" "}
            {effectiveRate.toFixed(2)}x).
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-xs text-white disabled:opacity-60"
              disabled={isGenerating}
              onClick={generateCloudAudio}
              type="button"
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              Générer audio cloud
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"
              onClick={previewWithBrowserSpeech}
              type="button"
            >
              <Volume className="size-3.5" />
              Prévisualisation temps réel
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"
              onClick={() => {
                audioRef.current?.pause();
                if (speechSupport) {
                  window.speechSynthesis.cancel();
                }
                setIsPlaying(false);
              }}
              type="button"
            >
              <Square className="size-3.5" />
              Stop
            </button>
          </div>
        </section>

        <aside className="liquid-panel rounded-2xl p-4 text-xs text-muted-foreground">
          <p className="mb-2 inline-flex items-center gap-2 font-medium text-foreground">
            <Waves className="size-4" />
            Animation audio
          </p>
          <p className="text-[11px]">
            <Gauge className="mr-1 inline size-3" />
            Style: {voiceStyle} · Variante: {voiceGender}
          </p>
          <p className="mb-2 text-[11px]">
            <Sparkles className="mr-1 inline size-3" />
            Web Speech: {speechSupport ? "actif" : "indisponible"}
          </p>

          <div className="mb-4 flex h-16 items-end gap-1 rounded-xl border border-border/40 bg-background/60 p-2">
            {bars.map((bar) => (
              <span
                className={`w-1.5 rounded-full bg-cyan-500/70 ${isPlaying || isGenerating ? "animate-pulse" : "opacity-40"}`}
                key={bar}
                style={{
                  height: `${25 + ((bar * 17) % 65)}%`,
                  animationDelay: `${bar * 45}ms`,
                }}
              />
            ))}
          </div>

          <p>
            {isGenerating
              ? "Génération en cours..."
              : isPlaying
                ? "Lecture en cours"
                : "Prêt"}
          </p>
          {estimatedDuration ? (
            <p className="mt-1 text-[11px]">
              Durée estimée : ~{estimatedDuration}s
            </p>
          ) : null}
          {provider ? (
            <p className="mt-1 text-[11px]">Provider: {provider}</p>
          ) : null}

          {audioUrl ? (
            <>
              <audio
                autoPlay
                className="mt-3 w-full"
                controls
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                ref={audioRef}
                src={audioUrl}
              >
                <track
                  default
                  kind="captions"
                  label="Transcription automatique indisponible"
                  src="data:text/vtt,WEBVTT"
                  srcLang={language}
                />
              </audio>

              <div className="mt-3 grid gap-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2"
                  onClick={handleDownload}
                  type="button"
                >
                  <Download className="size-3.5" />
                  Télécharger MP3
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2"
                  onClick={saveToLibrary}
                  type="button"
                >
                  <LibraryBig className="size-3.5" />
                  Ajouter à la bibliothèque
                </button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-[11px]">
              Générez un audio pour activer l'aperçu et le téléchargement.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
