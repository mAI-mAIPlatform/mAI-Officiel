"use client";

import {
  Download,
  LibraryBig,
  Loader2,
  Play,
  Square,
  Waves,
  MicVocal,
  Volume2,
  Settings2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { useWebSpeech } from "@/hooks/use-web-speech";

type SpeakyResponse = {
  audioBase64: string;
  contentType: string;
  durationEstimateSec: number;
  provider: string;
  selectedVoice?: string;
  suggestedVoices?: string[];
};

type VoiceStyle = "neutral" | "conversational" | "formal" | "excited" | "calm" | "narration";

const VOICE_STYLES: { id: VoiceStyle; label: string }[] = [
  { id: "neutral", label: "Neutre" },
  { id: "conversational", label: "Conversationnel" },
  { id: "formal", label: "Formel" },
  { id: "excited", label: "Enthousiaste" },
  { id: "calm", label: "Calme" },
  { id: "narration", label: "Narration" },
];

const getStyleModifiers = (style: VoiceStyle) => {
  switch (style) {
    case "conversational": return { pitch: 0.95, rate: 1.05, volume: 1.0 };
    case "formal": return { pitch: 0.9, rate: 0.95, volume: 0.95 };
    case "excited": return { pitch: 1.15, rate: 1.1, volume: 1.05 };
    case "calm": return { pitch: 0.85, rate: 0.85, volume: 0.9 };
    case "narration": return { pitch: 1.0, rate: 0.9, volume: 1.0 };
    default: return { pitch: 1.0, rate: 1.0, volume: 1.0 };
  }
};

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
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>("neutral");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(
    null
  );
  const [provider, setProvider] = useState<string | null>(null);
  const [isUsingWebSpeech, setIsUsingWebSpeech] = useState(true);
  const [selectedWebVoice, setSelectedWebVoice] = useState<string | null>(null);

  const { state: speechState, speak, stop: stopSpeech, getVoicesByLanguage } = useWebSpeech();
  
  const webVoices = useMemo(() => {
    return getVoicesByLanguage(language);
  }, [language, getVoicesByLanguage, speechState.voices]);

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

  const speechSettings = useMemo(() => {
    const styleMod = getStyleModifiers(voiceStyle);
    const selectedVoice = webVoices.find((v: SpeechSynthesisVoice) => v.name === selectedWebVoice) || webVoices[0] || null;

    return {
      rate: Math.max(0.5, Math.min(2, effectiveRate * styleMod.rate)),
      pitch: Math.max(0.5, Math.min(2, pitch * styleMod.pitch)),
      volume: Math.max(0.1, Math.min(1, volume * styleMod.volume)),
      voice: selectedVoice,
    };
  }, [effectiveRate, pitch, volume, voiceStyle, webVoices, selectedWebVoice]);

  const previewSpeech = useCallback(() => {
    if (!text.trim()) {
      toast.error("Ajoutez un texte pour la prévisualisation.");
      return;
    }

    const previewText = text.slice(0, 80) + (text.length > 80 ? "..." : "");
    speak(previewText, speechSettings);
  }, [text, speechSettings, speak]);

  useEffect(() => {
    if (speechState.error) {
      toast.error(speechState.error);
    }
  }, [speechState.error]);

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
        body: JSON.stringify({ text, language, voice }),
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

           <div className="grid gap-3 md:grid-cols-3">
             <label className="text-xs">
               Hauteur ({pitch.toFixed(2)})
               <input
                 className="mt-1 w-full"
                 max={1.8}
                 min={0.5}
                 onChange={(event) => setPitch(Number(event.target.value))}
                 step={0.05}
                 type="range"
                 value={pitch}
               />
             </label>
             
             <label className="text-xs">
               Volume ({Math.round(volume * 100)}%)
               <input
                 className="mt-1 w-full"
                 max={1}
                 min={0.2}
                 onChange={(event) => setVolume(Number(event.target.value))}
                 step={0.05}
                 type="range"
                 value={volume}
               />
             </label>
             
             <label className="text-xs">
               Style vocal
               <select
                 className="mt-1 w-full rounded-lg border border-border/50 bg-background px-2 py-2 text-xs"
                 onChange={(event) => setVoiceStyle(event.target.value as VoiceStyle)}
                 value={voiceStyle}
               >
                 {VOICE_STYLES.map((style) => (
                   <option key={style.id} value={style.id}>
                     {style.label}
                   </option>
                 ))}
               </select>
             </label>
           </div>

           <div className="grid gap-3">
             <label className="text-xs flex items-center justify-between">
               <span>Prévisualisation Web Speech API</span>
               <button
                 className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-accent"
                 onClick={previewSpeech}
                 disabled={!text.trim() || speechState.isSpeaking}
                 type="button"
               >
                 <MicVocal className="size-3" />
                 Prévisualiser
               </button>
             </label>
             
             {speechState.isSupported && webVoices.length > 0 && (
               <select
                 className="w-full rounded-lg border border-border/50 bg-background px-2 py-2 text-xs"
                 onChange={(event) => setSelectedWebVoice(event.target.value)}
                 value={selectedWebVoice || ""}
               >
                 <option value="">Sélectionner une voix système</option>
                 {webVoices.map((v: SpeechSynthesisVoice) => (
                   <option key={v.name} value={v.name}>
                     {v.name} ({v.localService ? "Local" : "Cloud"}) {v.default ? "✓ Défaut" : ""}
                   </option>
                 ))}
               </select>
             )}
           </div>

           <p className="text-[11px] text-muted-foreground">
             Taux effectif: {speechSettings.rate.toFixed(2)}x | Hauteur: {speechSettings.pitch.toFixed(2)} | Volume: {Math.round(speechSettings.volume * 100)}%
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
               onClick={() => {
                 audioRef.current?.pause();
                 stopSpeech();
                 setIsPlaying(false);
               }}
               type="button"
             >
               <Square className="size-3.5" />
               Stop tout
             </button>
             
             <label className="inline-flex items-center gap-2 px-2 py-2 text-xs">
               <input
                 type="checkbox"
                  checked={isUsingWebSpeech}
                  onChange={(e) => setIsUsingWebSpeech(e.target.checked)}
               />
               Utiliser Web Speech API en priorité
             </label>
           </div>
        </section>

        <aside className="liquid-panel rounded-2xl p-4 text-xs text-muted-foreground">
          <p className="mb-2 inline-flex items-center gap-2 font-medium text-foreground">
            <Waves className="size-4" />
            Animation audio
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
