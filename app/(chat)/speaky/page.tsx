"use client";

import {
  Download,
  FileText,
  Gauge,
  LibraryBig,
  Loader2,
  Pause,
  Play,
  Sparkles,
  Square,
  Upload,
  Volume,
  Waves,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { parseFileForAi, validateFileBeforeUpload } from "@/lib/file-parser";
import {
  SPEAKY_PUBLIC_GALLERY_STORAGE_KEY,
  type PublicSpeakyCreation,
  type SpeakyGalleryCategory,
} from "@/lib/speaky-gallery";
import { addStatsEvent } from "@/lib/user-stats";

type SpeakyResponse = {
  audioBase64: string;
  contentType: string;
  durationEstimateSec: number;
  provider: string;
  selectedVoice?: string;
  suggestedVoices?: string[];
};

type VoiceStyle = "narratif" | "conversationnel" | "énergique";
type GenerationMode = "batch" | "podcast";
type OutputFormat = "mp3" | "wav";

type BatchUnit = {
  text: string;
  voice: string;
  label: string;
};

type PresetCategory =
  | "narration"
  | "education"
  | "entertainment"
  | "professional"
  | "creative";

type AdvancedVoiceProfile = {
  emphasisWords: string[];
  pauseSeconds: number;
  volume: number;
};

type AudioPreset = {
  id: string;
  title: string;
  language: string;
  voice: string;
  voiceStyle: VoiceStyle;
  voiceGender: "homme" | "femme";
  rate: number;
  tone: number;
  advanced: AdvancedVoiceProfile;
  category?: PresetCategory;
  community?: boolean;
};

type TemplateCategory =
  | "education"
  | "professional"
  | "creative"
  | "personal";

type TextTemplate = {
  id: string;
  title: string;
  category: TemplateCategory;
  level?: string;
  text: string;
  usageCount: number;
  rating: number;
  recommendedPreset: AudioPreset;
};

type ScriptEditorMode = "standard" | "advanced";

type MarkerType =
  | "pause"
  | "emphasis"
  | "whisper"
  | "spell"
  | "pronounce";

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

const PODCAST_TEMPLATES = [
  {
    label: "Interview à deux voix",
    value:
      "[Lea]\nBonjour Mathieu, merci d'être avec nous aujourd'hui.\n\n[Mathieu]\nMerci Lea, je suis ravi de partager cette discussion avec vous.",
  },
  {
    label: "Narration + commentateur",
    value:
      "[Lea]\nBienvenue dans notre épisode hebdomadaire consacré à l'innovation.\n\n[Mathieu]\nPoint clé du jour : les assistants IA deviennent multimodaux et collaboratifs.",
  },
  {
    label: "Dialogue éducatif",
    value:
      "[Lea]\nAujourd'hui, on apprend comment fonctionne la photosynthèse.\n\n[Mathieu]\nExcellente idée. Les plantes utilisent la lumière pour transformer l'eau et le CO₂ en énergie.",
  },
] as const;

const VOICE_COLORS = [
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
];

const CATEGORY_LABELS: Record<PresetCategory, string> = {
  narration: "Narration",
  education: "Éducation",
  entertainment: "Divertissement",
  professional: "Professionnel",
  creative: "Créatif",
};

const SAMPLE_TEXT_BY_LANGUAGE: Record<string, string> = {
  fr: "Exemple audio rapide pour ce preset Speaky.",
  en: "Quick audio preview for this Speaky preset.",
  es: "Vista previa rápida de audio para este preset.",
  de: "Kurze Audiovorschau für dieses Preset.",
  it: "Anteprima audio rapida per questo preset.",
  pt: "Prévia rápida de áudio para este preset.",
  nl: "Snelle audiovoorbeeld voor deze preset.",
  pl: "Szybki podgląd audio dla tego presetu.",
  tr: "Bu hazır ayar için hızlı ses önizlemesi.",
  sv: "Snabb ljudförhandsvisning för denna preset.",
  ru: "Быстрый аудиопример для этого пресета.",
  ar: "معاينة صوتية سريعة لهذا الإعداد.",
  hi: "इस प्रीसेट के लिए त्वरित ऑडियो प्रीव्यू।",
  ja: "このプリセットのクイック音声プレビューです。",
  ko: "이 프리셋의 빠른 오디오 미리보기입니다.",
  zh: "这是此预设的快速音频预览。",
};

const COMMUNITY_PRESETS: AudioPreset[] = [
  {
    id: "community-narration-fr",
    title: "Narration livre audio",
    language: "fr",
    voice: "Lea",
    voiceStyle: "narratif",
    voiceGender: "femme",
    rate: 0.95,
    tone: 0,
    category: "narration",
    community: true,
    advanced: { emphasisWords: [], pauseSeconds: 0.3, volume: 1 },
  },
  {
    id: "community-education-en",
    title: "Cours clair",
    language: "en",
    voice: "Amy",
    voiceStyle: "conversationnel",
    voiceGender: "femme",
    rate: 1,
    tone: 1,
    category: "education",
    community: true,
    advanced: { emphasisWords: ["important", "remember"], pauseSeconds: 0.2, volume: 1 },
  },
  {
    id: "community-entertainment-fr",
    title: "Voix énergique pub",
    language: "fr",
    voice: "Mathieu",
    voiceStyle: "énergique",
    voiceGender: "homme",
    rate: 1.15,
    tone: 2,
    category: "entertainment",
    community: true,
    advanced: { emphasisWords: ["offre", "maintenant"], pauseSeconds: 0.1, volume: 1.05 },
  },
  {
    id: "community-pro-fr",
    title: "Briefing pro calme",
    language: "fr",
    voice: "Celine",
    voiceStyle: "narratif",
    voiceGender: "femme",
    rate: 0.9,
    tone: -1,
    category: "professional",
    community: true,
    advanced: { emphasisWords: [], pauseSeconds: 0.25, volume: 0.95 },
  },
  {
    id: "community-creative-fr",
    title: "Podcast calme ASMR",
    language: "fr",
    voice: "Lea",
    voiceStyle: "conversationnel",
    voiceGender: "femme",
    rate: 0.82,
    tone: -2,
    category: "creative",
    community: true,
    advanced: { emphasisWords: ["doucement"], pauseSeconds: 0.5, volume: 0.85 },
  },
];

const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  education: "Éducation",
  professional: "Professionnel",
  creative: "Créatif",
  personal: "Personnel",
};

const TEMPLATE_LIBRARY: TextTemplate[] = [
  {
    id: "edu-course-primary",
    title: "Mini cours niveau primaire",
    category: "education",
    level: "Primaire",
    usageCount: 1894,
    rating: 4.8,
    text: "Bonjour [prénom], aujourd'hui nous allons découvrir [le sujet]. À la fin de ce cours, tu sauras expliquer [objectif].",
    recommendedPreset: COMMUNITY_PRESETS[1]!,
  },
  {
    id: "edu-summary-college",
    title: "Résumé de leçon collège",
    category: "education",
    level: "Collège",
    usageCount: 1421,
    rating: 4.6,
    text: "Résumé de la leçon sur [le sujet] : idée clé numéro un [idée 1], idée clé numéro deux [idée 2], et conclusion [conclusion].",
    recommendedPreset: COMMUNITY_PRESETS[1]!,
  },
  {
    id: "pro-pitch",
    title: "Présentation commerciale",
    category: "professional",
    usageCount: 2210,
    rating: 4.9,
    text: "Bonjour [nom du client], je suis [votre nom] de [entreprise]. Aujourd'hui je vous présente [solution] pour répondre à [problème].",
    recommendedPreset: COMMUNITY_PRESETS[3]!,
  },
  {
    id: "pro-announcement",
    title: "Annonce d'entreprise",
    category: "professional",
    usageCount: 972,
    rating: 4.4,
    text: "Message interne : à compter du [date], l'équipe [service] met en place [nouveauté]. Merci de contacter [contact] pour toute question.",
    recommendedPreset: COMMUNITY_PRESETS[3]!,
  },
  {
    id: "creative-youtube",
    title: "Script intro YouTube",
    category: "creative",
    usageCount: 2554,
    rating: 4.7,
    text: "Salut la team, c'est [votre nom] ! Aujourd'hui on va parler de [le sujet] et je vais vous montrer [promesse]. Restez jusqu'à la fin !",
    recommendedPreset: COMMUNITY_PRESETS[2]!,
  },
  {
    id: "creative-podcast",
    title: "Introduction podcast",
    category: "creative",
    usageCount: 1640,
    rating: 4.8,
    text: "Bienvenue dans [nom du podcast], l'émission où l'on explore [thème]. Je suis [votre nom] et aujourd'hui, notre épisode est consacré à [sujet].",
    recommendedPreset: COMMUNITY_PRESETS[4]!,
  },
  {
    id: "personal-voice-message",
    title: "Message vocal personnel",
    category: "personal",
    usageCount: 884,
    rating: 4.3,
    text: "Bonjour [prénom], je voulais juste te dire [message principal]. N'hésite pas à me rappeler quand tu as un moment.",
    recommendedPreset: COMMUNITY_PRESETS[0]!,
  },
  {
    id: "personal-birthday",
    title: "Souhait anniversaire",
    category: "personal",
    usageCount: 1302,
    rating: 4.9,
    text: "Joyeux anniversaire [prénom] ! Je te souhaite [souhait 1], [souhait 2] et une journée remplie de [émotion positive].",
    recommendedPreset: COMMUNITY_PRESETS[0]!,
  },
];

function generateWaveBars(seed = 24) {
  return Array.from({ length: seed }, (_, index) => index);
}

function getEffectiveRate(rate: number, tone: number) {
  return Math.max(0.6, Math.min(2, rate * 2 ** (tone / 12)));
}

function splitLongSentence(sentence: string, maxChars = 500) {
  const chunks: string[] = [];
  let remaining = sentence.trim();

  while (remaining.length > maxChars) {
    const pivot = remaining.slice(0, maxChars + 1);
    const breakAt = Math.max(
      pivot.lastIndexOf(","),
      pivot.lastIndexOf(";"),
      pivot.lastIndexOf(":"),
      pivot.lastIndexOf(" ")
    );
    const index = breakAt > 0 ? breakAt : maxChars;
    chunks.push(remaining.slice(0, index).trim());
    remaining = remaining.slice(index).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks.filter(Boolean);
}

function splitTextIntoSmartSegments(input: string, maxChars = 500) {
  const text = input.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const sentenceCandidates = text
    .split(/(?<=[.!?…])\s+|\n{2,}/g)
    .map((item) => item.trim())
    .filter(Boolean);

  const segments: string[] = [];
  let current = "";

  for (const candidate of sentenceCandidates) {
    const pieces =
      candidate.length > maxChars
        ? splitLongSentence(candidate, maxChars)
        : [candidate];

    for (const piece of pieces) {
      if (!current) {
        current = piece;
        continue;
      }

      if (`${current} ${piece}`.length <= maxChars) {
        current = `${current} ${piece}`;
      } else {
        segments.push(current.trim());
        current = piece;
      }
    }
  }

  if (current.trim()) {
    segments.push(current.trim());
  }

  return segments;
}

function parsePodcastScript(script: string, fallbackVoice: string, maxChars = 500) {
  const blocks = script
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const units: BatchUnit[] = [];
  let activeVoice = fallbackVoice;

  for (const block of blocks) {
    const match = block.match(/^\[([^\]]+)\]\s*/);
    const voiceMarker = match?.[1]?.trim();
    const content = block.replace(/^\[[^\]]+\]\s*/, "").trim();

    if (voiceMarker) {
      activeVoice = voiceMarker;
    }

    if (!content) continue;

    const segments = splitTextIntoSmartSegments(content, maxChars);
    for (const [index, segment] of segments.entries()) {
      units.push({
        text: segment,
        voice: activeVoice,
        label:
          segments.length > 1
            ? `${activeVoice} · bloc ${index + 1}/${segments.length}`
            : activeVoice,
      });
    }
  }

  return units;
}

function concatUint8Arrays(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

function encodeWavFromAudioBuffer(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.length;
  const bytesPerSample = 2;
  const dataSize = samples * channels * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let sample = 0; sample < samples; sample += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const channelData = buffer.getChannelData(channel);
      const value = Math.max(-1, Math.min(1, channelData[sample] || 0));
      view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
      offset += 2;
    }
  }

  return wavBuffer;
}

async function decodeAndConcatToWav(chunks: Uint8Array[]) {
  const context = new AudioContext();
  try {
    const decoded = await Promise.all(
      chunks.map((chunk) =>
        context.decodeAudioData(Uint8Array.from(chunk).buffer)
      )
    );
    const sampleRate = decoded[0]?.sampleRate ?? 22050;
    const numberOfChannels = Math.max(
      1,
      ...decoded.map((buffer) => buffer.numberOfChannels)
    );
    const totalLength = decoded.reduce((sum, buffer) => sum + buffer.length, 0);
    const output = context.createBuffer(numberOfChannels, totalLength, sampleRate);

    let writeOffset = 0;
    for (const buffer of decoded) {
      for (let channel = 0; channel < numberOfChannels; channel += 1) {
        const target = output.getChannelData(channel);
        const source =
          buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1));
        target.set(source, writeOffset);
      }
      writeOffset += buffer.length;
    }

    return encodeWavFromAudioBuffer(output);
  } finally {
    await context.close();
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyAdvancedProfileToText(text: string, profile: AdvancedVoiceProfile) {
  let transformed = text;

  if (profile.emphasisWords.length > 0) {
    for (const word of profile.emphasisWords) {
      const cleanWord = word.trim();
      if (!cleanWord) continue;
      const regex = new RegExp(`\\b${escapeRegex(cleanWord)}\\b`, "gi");
      transformed = transformed.replace(regex, (match) => match.toUpperCase());
    }
  }

  if (profile.pauseSeconds > 0) {
    const pauseStrength = Math.max(0, Math.min(2, profile.pauseSeconds));
    const dots = "… ".repeat(Math.max(1, Math.round(pauseStrength / 0.4)));
    transformed = transformed.replace(/([.!?])\s+/g, `$1 ${dots}`);
  }

  return transformed;
}

function buildShareLinkFromPreset(preset: AudioPreset) {
  const payload = encodeURIComponent(
    btoa(unescape(encodeURIComponent(JSON.stringify(preset))))
  );
  return `${window.location.origin}/speaky?preset=${payload}`;
}

function cleanExtractedText(raw: string) {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type SrtCue = {
  startMs: number;
  endMs: number;
  text: string;
};

function parseTimestampToMs(value: string) {
  const match = value.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!match) return 0;
  const [, hh, mm, ss, ms] = match;
  return (
    Number(hh) * 3_600_000 +
    Number(mm) * 60_000 +
    Number(ss) * 1_000 +
    Number(ms)
  );
}

function parseSrtContent(content: string) {
  const cues: SrtCue[] = [];
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\n+/);
  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;
    const timeLine = lines[1]?.includes("-->") ? lines[1] : lines[0];
    if (!timeLine.includes("-->")) continue;
    const [startRaw, endRaw] = timeLine.split("-->").map((item) => item.trim());
    const textLines = lines.slice(timeLine === lines[1] ? 2 : 1).join(" ");
    cues.push({
      startMs: parseTimestampToMs(startRaw),
      endMs: parseTimestampToMs(endRaw),
      text: textLines.replace(/<[^>]+>/g, "").trim(),
    });
  }
  return cues.filter((cue) => cue.text.length > 0);
}

function extractMarkerCount(source: string) {
  const regex =
    /\[(pause:\d{2,4}ms|emphasis:[^\]]+|whisper:[^\]]+|spell:[^\]]+|pronounce:[^|\]]+\|[^\]]+)\]/g;
  return (source.match(regex) ?? []).length;
}

function extractPlainTextFromScript(source: string) {
  return source
    .replace(/\[pause:(\d{2,4})ms\]/g, " ")
    .replace(/\[emphasis:([^\]]+)\]/g, "$1")
    .replace(/\[whisper:([^\]]+)\]/g, "$1")
    .replace(/\[spell:([^\]]+)\]/g, (_, word) =>
      String(word)
        .split("")
        .join(" ")
    )
    .replace(/\[pronounce:([^|\]]+)\|([^\]]+)\]/g, "$1");
}

function scriptToSsml(source: string) {
  const escaped = source
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const body = escaped
    .replace(/\[pause:(\d{2,4})ms\]/g, '<break time="$1ms" />')
    .replace(
      /\[emphasis:([^\]]+)\]/g,
      '<emphasis level="strong">$1</emphasis>'
    )
    .replace(
      /\[whisper:([^\]]+)\]/g,
      '<prosody volume="x-soft" rate="85%">$1</prosody>'
    )
    .replace(
      /\[spell:([^\]]+)\]/g,
      '<say-as interpret-as="characters">$1</say-as>'
    )
    .replace(
      /\[pronounce:([^|\]]+)\|([^\]]+)\]/g,
      '<phoneme alphabet="ipa" ph="$2">$1</phoneme>'
    );

  return `<speak>${body}</speak>`;
}

function getMarkerVisuals(script: string) {
  const markers: Array<{ icon: string; color: string; label: string; detail: string }> = [];
  const patterns: Array<{
    type: MarkerType;
    regex: RegExp;
    mapper: (...parts: string[]) => { label: string; detail: string };
  }> = [
    {
      type: "pause",
      regex: /\[pause:(\d{2,4})ms\]/g,
      mapper: (duration) => ({ label: "Pause", detail: `${duration} ms` }),
    },
    {
      type: "emphasis",
      regex: /\[emphasis:([^\]]+)\]/g,
      mapper: (text) => ({ label: "Emphase", detail: text }),
    },
    {
      type: "whisper",
      regex: /\[whisper:([^\]]+)\]/g,
      mapper: (text) => ({ label: "Murmure", detail: text }),
    },
    {
      type: "spell",
      regex: /\[spell:([^\]]+)\]/g,
      mapper: (text) => ({ label: "Épeler", detail: text }),
    },
    {
      type: "pronounce",
      regex: /\[pronounce:([^|\]]+)\|([^\]]+)\]/g,
      mapper: (word, ipa) => ({ label: "Prononciation", detail: `${word} → ${ipa}` }),
    },
  ];

  for (const pattern of patterns) {
    for (const match of script.matchAll(pattern.regex)) {
      const mapped = pattern.mapper(...match.slice(1));
      const visuals: Record<MarkerType, { icon: string; color: string }> = {
        pause: { icon: "⏸️", color: "bg-blue-500/15 text-blue-700" },
        emphasis: { icon: "🔥", color: "bg-orange-500/15 text-orange-700" },
        whisper: { icon: "🤫", color: "bg-violet-500/15 text-violet-700" },
        spell: { icon: "🔤", color: "bg-emerald-500/15 text-emerald-700" },
        pronounce: { icon: "🗣️", color: "bg-cyan-500/15 text-cyan-700" },
      };
      markers.push({ ...visuals[pattern.type], ...mapped });
    }
  }

  return markers;
}

export default function SpeakyPage() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("fr");
  const [scriptEditorMode, setScriptEditorMode] =
    useState<ScriptEditorMode>("standard");
  const [pauseDurationMs, setPauseDurationMs] = useState(500);
  const [pronunciationIpa, setPronunciationIpa] = useState("");
  const [voice, setVoice] = useState("Lea");
  const [rate, setRate] = useState(1);
  const [tone, setTone] = useState(0);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>("narratif");
  const [voiceGender, setVoiceGender] = useState<"homme" | "femme">("femme");
  const [mode, setMode] = useState<GenerationMode>("batch");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp3");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    percent: 0,
    etaSec: 0,
  });
  const [audioUrl, setAudioUrl] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [presetTitle, setPresetTitle] = useState("");
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [selectedTemplateCategory, setSelectedTemplateCategory] =
    useState<TemplateCategory>("education");
  const [previewingPresetId, setPreviewingPresetId] = useState<string | null>(null);
  const [previewingTemplateId, setPreviewingTemplateId] = useState<string | null>(
    null
  );
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [lastImportPreview, setLastImportPreview] = useState("");
  const [lastImportMeta, setLastImportMeta] = useState<{
    fileName: string;
    chars: number;
    segments: number;
    isSrt: boolean;
  } | null>(null);
  const [applySrtTiming, setApplySrtTiming] = useState(false);
  const [srtCues, setSrtCues] = useState<SrtCue[]>([]);
  const [advancedProfile, setAdvancedProfile] = useState<AdvancedVoiceProfile>({
    emphasisWords: [],
    pauseSeconds: 0,
    volume: 1,
  });
  const [history, setHistory] = useLocalStorage<
    Array<{
      createdAt: string;
      pinned?: boolean;
      text: string;
      voice: string;
      url: string;
    }>
  >("mai.speaky.history.v1", []);
  const [personalPresets, setPersonalPresets] = useLocalStorage<AudioPreset[]>(
    "mai.speaky.presets.v1",
    []
  );
  const [recentImports, setRecentImports] = useLocalStorage<
    Array<{ fileName: string; extractedText: string; importedAt: string }>
  >("mai.speaky.recent-imports.v1", []);
  const [, setPublicGalleryItems] = useLocalStorage<PublicSpeakyCreation[]>(
    SPEAKY_PUBLIC_GALLERY_STORAGE_KEY,
    []
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const editorTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const quickPreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef("");
  const pauseResolverRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(false);
  const bars = useMemo(() => generateWaveBars(), []);
  const availableVoices = useMemo(
    () => VOICES_BY_LANGUAGE[language] ?? VOICES_BY_LANGUAGE.fr,
    [language]
  );
  const effectiveRate = useMemo(() => getEffectiveRate(rate, tone), [rate, tone]);
  const speechSupport =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;
  const markerCount = useMemo(() => extractMarkerCount(text), [text]);
  const plainTextForGeneration = useMemo(
    () =>
      scriptEditorMode === "advanced" ? extractPlainTextFromScript(text) : text,
    [scriptEditorMode, text]
  );
  const ssmlPreview = useMemo(
    () => scriptToSsml(text),
    [text]
  );
  const markerVisuals = useMemo(() => getMarkerVisuals(text), [text]);
  const rawTextLength = plainTextForGeneration.trim().length;

  const batchSegments = useMemo(
    () => splitTextIntoSmartSegments(plainTextForGeneration),
    [plainTextForGeneration]
  );
  const podcastUnits = useMemo(
    () => parsePodcastScript(plainTextForGeneration, voice),
    [plainTextForGeneration, voice]
  );
  const activeUnits = mode === "podcast" ? podcastUnits : batchSegments.map((segment, index) => ({
    text: segment,
    voice,
    label: `Segment ${index + 1}`,
  }));

  const voicesInPodcast = useMemo(() => {
    const seen = new Set<string>();
    for (const unit of podcastUnits) {
      seen.add(unit.voice);
    }
    return Array.from(seen);
  }, [podcastUnits]);

  const cloudUsagePercent = Math.min((Math.min(rawTextLength, 500) / 500) * 100, 100);
  const communityPresetsByCategory = useMemo(() => {
    return COMMUNITY_PRESETS.reduce<Record<PresetCategory, AudioPreset[]>>(
      (acc, preset) => {
        const category = preset.category ?? "creative";
        acc[category].push(preset);
        return acc;
      },
      {
        narration: [],
        education: [],
        entertainment: [],
        professional: [],
        creative: [],
      }
    );
  }, []);
  const filteredTemplates = useMemo(
    () =>
      TEMPLATE_LIBRARY.filter(
        (template) => template.category === selectedTemplateCategory
      ),
    [selectedTemplateCategory]
  );
  const featuredTemplates = useMemo(
    () =>
      [...TEMPLATE_LIBRARY]
        .sort((a, b) => b.usageCount * b.rating - a.usageCount * a.rating)
        .slice(0, 4),
    []
  );

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
    audioRef.current.volume = Math.max(0, Math.min(1, advancedProfile.volume / 1.2));
  }, [advancedProfile.volume, effectiveRate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedPreset = params.get("preset");
    if (!sharedPreset) {
      return;
    }

    try {
      const parsed = JSON.parse(
        decodeURIComponent(escape(atob(decodeURIComponent(sharedPreset))))
      ) as AudioPreset;
      if (!parsed?.title || !parsed?.voice || !parsed?.language) {
        return;
      }
      setPersonalPresets((current) => {
        if (current.some((preset) => preset.id === parsed.id)) {
          return current;
        }
        return [{ ...parsed, community: false }, ...current].slice(0, 40);
      });
      toast.success(`Preset importé: ${parsed.title}`);
    } catch {
      toast.error("Lien de preset invalide.");
    }
  }, [setPersonalPresets]);

  useEffect(() => {
    return () => {
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
    };
  }, []);

  const waitIfPaused = async () => {
    if (!pausedRef.current) {
      return;
    }

    await new Promise<void>((resolve) => {
      pauseResolverRef.current = resolve;
    });
  };

  const togglePause = () => {
    setIsPaused((current) => {
      const next = !current;
      pausedRef.current = next;
      if (!next && pauseResolverRef.current) {
        pauseResolverRef.current();
        pauseResolverRef.current = null;
      }
      return next;
    });
  };

  const applyPreset = (preset: AudioPreset) => {
    setLanguage(preset.language);
    setVoice(preset.voice);
    setVoiceStyle(preset.voiceStyle);
    setVoiceGender(preset.voiceGender);
    setRate(preset.rate);
    setTone(preset.tone);
    setAdvancedProfile(preset.advanced);
    toast.success(`Preset appliqué: ${preset.title}`);
  };

  const saveCurrentAsPreset = () => {
    const title = presetTitle.trim();
    if (!title) {
      toast.error("Donnez un nom au preset.");
      return;
    }
    const preset: AudioPreset = {
      id: crypto.randomUUID(),
      title,
      language,
      voice,
      voiceStyle,
      voiceGender,
      rate,
      tone,
      advanced: advancedProfile,
      community: false,
    };
    setPersonalPresets((current) => [preset, ...current].slice(0, 40));
    setPresetTitle("");
    toast.success("Preset personnel sauvegardé.");
  };

  const exportPresetLink = async (preset: AudioPreset) => {
    try {
      const link = buildShareLinkFromPreset(preset);
      await navigator.clipboard.writeText(link);
      toast.success("Lien du preset copié.");
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  const quickPreviewPreset = async (preset: AudioPreset) => {
    try {
      setPreviewingPresetId(preset.id);
      const sample = SAMPLE_TEXT_BY_LANGUAGE[preset.language] ?? SAMPLE_TEXT_BY_LANGUAGE.fr;
      const response = await fetch("/api/speaky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: applyAdvancedProfileToText(sample, preset.advanced),
          language: preset.language,
          voice: preset.voice,
          voiceStyle: preset.voiceStyle,
          voiceGender: preset.voiceGender,
        }),
      });
      const payload = (await response.json()) as SpeakyResponse & { error?: string };
      if (!response.ok || !payload.audioBase64) {
        throw new Error(payload.error ?? "Pré-écoute indisponible");
      }
      const bytes = Uint8Array.from(atob(payload.audioBase64), (char) =>
        char.charCodeAt(0)
      );
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      if (quickPreviewAudioRef.current) {
        quickPreviewAudioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, preset.advanced.volume / 1.2));
      quickPreviewAudioRef.current = audio;
      audio.play().catch(() => undefined);
      setTimeout(() => {
        audio.pause();
        URL.revokeObjectURL(url);
      }, 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pré-écoute impossible");
    } finally {
      setPreviewingPresetId(null);
    }
  };

  const applyTemplate = (template: TextTemplate) => {
    setText(template.text);
    applyPreset(template.recommendedPreset);
    setIsTemplatePanelOpen(false);
    toast.success(`Template appliqué: ${template.title}`);
  };

  const insertMarker = (type: MarkerType) => {
    if (scriptEditorMode !== "advanced") {
      toast.error("Passez en mode avancé pour insérer des marqueurs.");
      return;
    }
    const textarea = editorTextAreaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selected = text.slice(selectionStart, selectionEnd).trim();
    const before = text.slice(0, selectionStart);
    const after = text.slice(selectionEnd);

    let marker = "";
    switch (type) {
      case "pause":
        marker = `[pause:${pauseDurationMs}ms]`;
        break;
      case "emphasis":
        marker = `[emphasis:${selected || "mot clé"}]`;
        break;
      case "whisper":
        marker = `[whisper:${selected || "texte chuchoté"}]`;
        break;
      case "spell":
        marker = `[spell:${selected || "IA"}]`;
        break;
      case "pronounce":
        marker = `[pronounce:${selected || "mot"}|${pronunciationIpa || "mə"}]`;
        break;
      default:
        marker = "";
    }

    setText(`${before}${marker}${after}`);
    setTimeout(() => {
      const cursor = before.length + marker.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  };

  const resetAllMarkers = () => {
    setText(extractPlainTextFromScript(text));
  };

  const previewTemplate = async (template: TextTemplate) => {
    try {
      setPreviewingTemplateId(template.id);
      await quickPreviewPreset(template.recommendedPreset);
    } finally {
      setPreviewingTemplateId(null);
    }
  };

  const importDocument = async (file: File) => {
    const error = validateFileBeforeUpload(file);
    if (error) {
      toast.error(error);
      return;
    }

    const isSrt = file.name.toLowerCase().endsWith(".srt");
    let extractedText = "";
    let cues: SrtCue[] = [];

    if (isSrt) {
      const content = await file.text();
      cues = parseSrtContent(content);
      extractedText = cues.map((cue) => cue.text).join("\n");
    } else {
      const parsed = await parseFileForAi(file);
      extractedText = parsed.extractedText;
    }

    const cleaned = cleanExtractedText(extractedText);
    if (!cleaned) {
      toast.error("Aucun texte exploitable détecté dans ce document.");
      return;
    }

    setText(cleaned);
    setLastImportPreview(cleaned.slice(0, 1200));
    setLastImportMeta({
      fileName: file.name,
      chars: cleaned.length,
      segments: splitTextIntoSmartSegments(cleaned).length,
      isSrt,
    });
    setApplySrtTiming(isSrt && cues.length > 0);
    setSrtCues(cues);
    setRecentImports((current) =>
      [
        { fileName: file.name, extractedText: cleaned, importedAt: new Date().toISOString() },
        ...current,
      ].slice(0, 8)
    );
    toast.success(`Document importé: ${file.name}`);
  };

  const onDocumentInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await importDocument(file);
    event.target.value = "";
  };

  const publishHistoryItem = (item: { text: string; voice: string; url: string; createdAt: string }) => {
    const title = window.prompt("Titre public de cette création ?");
    if (!title) return;
    const description =
      window.prompt("Description courte (optionnelle) :") ?? "";
    const categoryInput =
      window.prompt(
        "Catégorie (narration, education, entertainment, music, professional) :",
        "narration"
      ) ?? "narration";
    const category = ([
      "narration",
      "education",
      "entertainment",
      "music",
      "professional",
    ] as const).includes(categoryInput as SpeakyGalleryCategory)
      ? (categoryInput as SpeakyGalleryCategory)
      : "narration";
    const tag = window.prompt("Tag optionnel :") ?? "";
    const creatorName = window.prompt("Pseudo créateur :") ?? "anonymous";

    const creation: PublicSpeakyCreation = {
      id: crypto.randomUUID(),
      title,
      description,
      category,
      tag,
      language,
      voice: item.voice,
      creatorName,
      createdAt: new Date().toISOString(),
      durationSec: Math.max(8, Math.ceil(item.text.length / 12)),
      listens: 0,
      favorites: 0,
      audioUrl: item.url,
    };
    setPublicGalleryItems((current) => [creation, ...current].slice(0, 200));
    toast.success("Création publiée dans la Galerie Speaky.");
  };

  const generateBatchAudio = async () => {
    if (!plainTextForGeneration.trim()) {
      toast.error("Ajoutez un texte avant de générer l'audio.");
      return;
    }

    if (!activeUnits.length) {
      toast.error("Impossible de découper ce texte en segments exploitables.");
      return;
    }

    const unitsForGeneration: BatchUnit[] =
      mode === "batch" && applySrtTiming && srtCues.length > 0
        ? srtCues.map((cue, index) => {
            const next = srtCues[index + 1];
            const gapMs = next ? Math.max(0, next.startMs - cue.endMs) : 0;
            const extraPause = "… ".repeat(Math.min(5, Math.round(gapMs / 400)));
            return {
              text: `${cue.text}${extraPause ? ` ${extraPause}` : ""}`.trim(),
              voice,
              label: `SRT ${index + 1}`,
            };
          })
        : activeUnits;

    setIsGenerating(true);
    setIsPaused(false);
    pausedRef.current = false;
    setProgress({ completed: 0, total: unitsForGeneration.length, percent: 0, etaSec: 0 });

    const startedAt = Date.now();
    const mp3Chunks: Uint8Array[] = [];
    let totalDuration = 0;

    try {
      for (const [index, unit] of unitsForGeneration.entries()) {
        await waitIfPaused();
        const transformedText = applyAdvancedProfileToText(
          unit.text,
          advancedProfile
        );

        const response = await fetch("/api/speaky", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: transformedText,
            language,
            voice: unit.voice,
            voiceStyle,
            voiceGender,
          }),
        });

        const payload = (await response.json()) as SpeakyResponse & { error?: string };
        if (!response.ok || !payload.audioBase64) {
          throw new Error(payload.error ?? `Génération impossible sur ${unit.label}`);
        }

        addStatsEvent("api_call", 1);

        const bytes = Uint8Array.from(atob(payload.audioBase64), (char) =>
          char.charCodeAt(0)
        );
        mp3Chunks.push(bytes);
        totalDuration += payload.durationEstimateSec;

        const completed = index + 1;
        const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);
        const average = elapsed / completed;
        const remaining = Math.max(0, unitsForGeneration.length - completed);

        setProgress({
          completed,
          total: unitsForGeneration.length,
          percent: Math.round((completed / unitsForGeneration.length) * 100),
          etaSec: Math.round(average * remaining),
        });
      }

      const outputBlob =
        outputFormat === "wav"
          ? new Blob([await decodeAndConcatToWav(mp3Chunks)], { type: "audio/wav" })
          : new Blob([concatUint8Arrays(mp3Chunks)], { type: "audio/mpeg" });

      const nextUrl = URL.createObjectURL(outputBlob);
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
      currentAudioUrlRef.current = nextUrl;

      setAudioUrl(nextUrl);
      setEstimatedDuration(totalDuration);
      setProvider("streamelements + batch");
      setHistory(
        [
          {
            createdAt: new Date().toISOString(),
            pinned: false,
            text: plainTextForGeneration,
            voice,
            url: nextUrl,
          },
          ...history,
        ].slice(0, 20)
      );

      toast.success(
        mode === "podcast"
          ? "Podcast multi-voix généré avec succès."
          : "Audio par lot généré avec succès."
      );

      setTimeout(() => {
        audioRef.current?.play().catch(() => {
          // Ignore autoplay restrictions.
        });
      }, 10);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de génération audio");
    } finally {
      setIsGenerating(false);
      setIsPaused(false);
      pausedRef.current = false;
      setProgress((current) => ({ ...current, etaSec: 0 }));
    }
  };

  const previewWithBrowserSpeech = () => {
    if (!plainTextForGeneration.trim()) {
      toast.error("Ajoutez du texte pour la prévisualisation.");
      return;
    }

    if (!speechSupport) {
      toast.error("Web Speech API indisponible sur ce navigateur.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plainTextForGeneration);
    utterance.rate = Math.max(0.5, Math.min(1.8, rate));
    utterance.pitch = Math.max(0, Math.min(2, 1 + tone / 10));
    utterance.lang = `${language}-${language.toUpperCase()}`;
    utterance.volume = 1;

    const styleBoost =
      voiceStyle === "énergique" ? 0.12 : voiceStyle === "conversationnel" ? 0.04 : 0;
    utterance.rate = Math.max(0.5, Math.min(2, utterance.rate + styleBoost));

    const selectedVoice = window.speechSynthesis
      .getVoices()
      .find((candidate) => candidate.lang.toLowerCase().startsWith(language.toLowerCase()));
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const previewFiveSeconds = () => {
    if (!audioRef.current || !audioUrl) {
      toast.error("Générez un audio avant la pré-écoute.");
      return;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      // Ignore autoplay restrictions.
    });

    setTimeout(() => {
      audioRef.current?.pause();
    }, 5000);
  };

  const handleDownload = () => {
    if (!audioUrl) {
      toast.error("Aucun audio à télécharger.");
      return;
    }

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `speaky-${Date.now()}.${outputFormat}`;
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
    const file = new File([blob], `speaky-${Date.now()}.${outputFormat}`, {
      type: outputFormat === "wav" ? "audio/wav" : "audio/mpeg",
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
            Génération par lot et podcast multi-voix.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <section
          className={`liquid-panel space-y-3 rounded-2xl p-4 ${isDraggingFile ? "ring-2 ring-cyan-500" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDraggingFile(false);
          }}
          onDrop={async (event) => {
            event.preventDefault();
            setIsDraggingFile(false);
            const file = event.dataTransfer.files?.[0];
            if (file) {
              await importDocument(file);
            }
          }}
        >
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-xl px-3 py-2 text-xs ${mode === "batch" ? "bg-black text-white" : "border"}`}
              onClick={() => setMode("batch")}
              type="button"
            >
              Batch long texte
            </button>
            <button
              className={`rounded-xl px-3 py-2 text-xs ${mode === "podcast" ? "bg-black text-white" : "border"}`}
              onClick={() => setMode("podcast")}
              type="button"
            >
              Podcast multi-voix
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"
              onClick={() => setIsTemplatePanelOpen((current) => !current)}
              type="button"
            >
              <Wand2 className="size-3.5" />
              Templates texte
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs">
              <FileText className="size-3.5" />
              Import document
              <input
                accept=".pdf,.docx,.txt,.srt,.md,.json,.csv"
                className="hidden"
                onChange={onDocumentInput}
                type="file"
              />
            </label>
          </div>

          {isTemplatePanelOpen ? (
            <div className="rounded-xl border border-border/50 bg-background/40 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Bibliothèque de templates prêts à l'emploi
              </p>
              <div className="mb-2 flex flex-wrap gap-1">
                {(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateCategory[]).map(
                  (category) => (
                    <button
                      className={`rounded-lg px-2 py-1 text-[11px] ${
                        selectedTemplateCategory === category
                          ? "bg-black text-white"
                          : "border"
                      }`}
                      key={category}
                      onClick={() => setSelectedTemplateCategory(category)}
                      type="button"
                    >
                      {TEMPLATE_CATEGORY_LABELS[category]}
                    </button>
                  )
                )}
              </div>

              <p className="mb-1 text-[11px] font-medium text-foreground">
                Tendances communauté
              </p>
              <div className="mb-3 grid gap-2 md:grid-cols-2">
                {featuredTemplates.map((template) => (
                  <div className="rounded-lg border border-border/40 p-2" key={template.id}>
                    <p className="font-medium text-foreground">{template.title}</p>
                    <p className="text-[11px]">
                      ⭐ {template.rating.toFixed(1)} · {template.usageCount.toLocaleString("fr-FR")} usages
                    </p>
                  </div>
                ))}
              </div>

              <div className="max-h-56 space-y-2 overflow-auto">
                {filteredTemplates.map((template) => (
                  <div className="rounded-lg border border-border/40 p-2" key={template.id}>
                    <p className="font-medium text-foreground">{template.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {template.level ? `${template.level} · ` : ""}
                      ⭐ {template.rating.toFixed(1)} · {template.usageCount.toLocaleString("fr-FR")} usages
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px]">{template.text}</p>
                    <div className="mt-2 flex gap-1">
                      <button
                        className="rounded border px-2 py-1 text-[11px]"
                        onClick={() => applyTemplate(template)}
                        type="button"
                      >
                        Utiliser
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-[11px]"
                        onClick={() => previewTemplate(template)}
                        type="button"
                      >
                        {previewingTemplateId === template.id ? "..." : "Prévisualiser"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-border/50 bg-background/40 p-2">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">Mode éditeur</span>
              <button
                className={`rounded-lg px-2 py-1 text-[11px] ${scriptEditorMode === "standard" ? "bg-black text-white" : "border"}`}
                onClick={() => setScriptEditorMode("standard")}
                type="button"
              >
                Standard
              </button>
              <button
                className={`rounded-lg px-2 py-1 text-[11px] ${scriptEditorMode === "advanced" ? "bg-black text-white" : "border"}`}
                onClick={() => setScriptEditorMode("advanced")}
                type="button"
              >
                Avancé
              </button>
            </div>
            {scriptEditorMode === "advanced" ? (
              <>
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  <button className="rounded border px-2 py-1 text-[11px]" onClick={() => insertMarker("pause")} type="button">
                    Pause
                  </button>
                  <input
                    className="w-20 rounded border border-border/50 bg-background px-1 py-1 text-[11px]"
                    max={3000}
                    min={100}
                    onChange={(event) => setPauseDurationMs(Number(event.target.value))}
                    step={100}
                    type="number"
                    value={pauseDurationMs}
                  />
                  <span className="text-[11px] text-muted-foreground">ms</span>
                  <button className="rounded border px-2 py-1 text-[11px]" onClick={() => insertMarker("emphasis")} type="button">
                    Emphase
                  </button>
                  <button className="rounded border px-2 py-1 text-[11px]" onClick={() => insertMarker("whisper")} type="button">
                    Murmure
                  </button>
                  <button className="rounded border px-2 py-1 text-[11px]" onClick={() => insertMarker("spell")} type="button">
                    Épeler
                  </button>
                  <button className="rounded border px-2 py-1 text-[11px]" onClick={() => insertMarker("pronounce")} type="button">
                    Prononciation
                  </button>
                  <input
                    className="w-28 rounded border border-border/50 bg-background px-1 py-1 text-[11px]"
                    onChange={(event) => setPronunciationIpa(event.target.value)}
                    placeholder="IPA simplifié"
                    value={pronunciationIpa}
                  />
                  <button className="rounded border border-red-300 px-2 py-1 text-[11px] text-red-600" onClick={resetAllMarkers} type="button">
                    Réinitialiser marqueurs
                  </button>
                </div>
                <div className="mb-1 flex flex-wrap gap-1">
                  {markerVisuals.slice(0, 12).map((marker, index) => (
                    <span
                      className={`rounded px-2 py-1 text-[10px] ${marker.color}`}
                      key={`${marker.label}-${index}`}
                      title={`${marker.label}: ${marker.detail}`}
                    >
                      {marker.icon} {marker.label}
                    </span>
                  ))}
                  {markerVisuals.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground">
                      Aucun marqueur inséré.
                    </span>
                  ) : null}
                </div>
                <details className="text-[11px]">
                  <summary className="cursor-pointer text-muted-foreground">
                    Aperçu SSML généré automatiquement
                  </summary>
                  <pre className="mt-1 max-h-28 overflow-auto rounded border border-border/40 bg-background/60 p-2 whitespace-pre-wrap">
                    {ssmlPreview}
                  </pre>
                </details>
              </>
            ) : null}
          </div>

          {mode === "podcast" ? (
            <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
              <div className="space-y-2">
                <textarea
                  className="min-h-[280px] w-full rounded-xl border border-border/40 bg-background/70 p-3 text-sm"
                  onChange={(event) => setText(event.target.value)}
                  placeholder="[Lea] Bonjour et bienvenue...\n\n[Mathieu] Merci Lea..."
                  ref={editorTextAreaRef}
                  value={text}
                />
                <div className="flex flex-wrap gap-2">
                  {PODCAST_TEMPLATES.map((template) => (
                    <button
                      className="rounded-lg border px-2 py-1 text-[11px]"
                      key={template.label}
                      onClick={() => setText(template.value)}
                      type="button"
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>
              <aside className="rounded-xl border border-border/50 bg-background/40 p-2 text-[11px]">
                <p className="mb-2 font-semibold text-foreground">Voix utilisées</p>
                <div className="space-y-1">
                  {(voicesInPodcast.length ? voicesInPodcast : [voice]).map((voiceName, index) => (
                    <p
                      className={`rounded px-2 py-1 ${VOICE_COLORS[index % VOICE_COLORS.length]}`}
                      key={voiceName}
                    >
                      {voiceName}
                    </p>
                  ))}
                </div>
                <p className="mt-3 mb-1 font-semibold text-foreground">Aperçu alternances</p>
                <div className="max-h-40 space-y-1 overflow-auto">
                  {podcastUnits.slice(0, 12).map((unit, index) => (
                    <p
                      className={`rounded px-2 py-1 ${VOICE_COLORS[index % VOICE_COLORS.length]}`}
                      key={`${unit.label}-${index}`}
                    >
                      [{unit.voice}] {unit.text.slice(0, 80)}
                      {unit.text.length > 80 ? "…" : ""}
                    </p>
                  ))}
                </div>
              </aside>
            </div>
          ) : (
            <>
              <textarea
                className="min-h-[280px] w-full rounded-xl border border-border/40 bg-background/70 p-3 text-sm"
                onChange={(event) => setText(event.target.value)}
                placeholder="Collez ou importez un texte long à transformer en audio..."
                ref={editorTextAreaRef}
                value={text}
              />
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs">
                  <Upload className="size-3.5" />
                  Importer un fichier texte
                  <input accept=".txt,.md,.csv,.json,.docx,.pdf,.srt" className="hidden" onChange={onDocumentInput} type="file" />
                </label>
              </div>
            </>
          )}

          {lastImportMeta ? (
            <div className="rounded-xl border border-border/50 bg-background/40 p-2 text-[11px]">
              <p className="font-medium text-foreground">
                Aperçu import: {lastImportMeta.fileName}
              </p>
              <p>
                {lastImportMeta.chars} caractères · {lastImportMeta.segments} segments
              </p>
              {lastImportMeta.isSrt ? (
                <label className="mt-1 inline-flex items-center gap-2">
                  <input
                    checked={applySrtTiming}
                    onChange={(event) => setApplySrtTiming(event.target.checked)}
                    type="checkbox"
                  />
                  Utiliser les timecodes SRT pour synchroniser les pauses
                </label>
              ) : null}
              <p className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-muted-foreground">
                {lastImportPreview}
              </p>
            </div>
          ) : null}

          {recentImports.length > 0 ? (
            <div className="rounded-xl border border-border/50 bg-background/40 p-2 text-[11px]">
              <p className="mb-1 font-medium text-foreground">Imports récents</p>
              <div className="max-h-24 space-y-1 overflow-auto">
                {recentImports.map((entry) => (
                  <button
                    className="block w-full rounded border border-border/40 px-2 py-1 text-left"
                    key={`${entry.fileName}-${entry.importedAt}`}
                    onClick={() => {
                      setText(entry.extractedText);
                      setLastImportPreview(entry.extractedText.slice(0, 1200));
                      setLastImportMeta({
                        fileName: entry.fileName,
                        chars: entry.extractedText.length,
                        segments: splitTextIntoSmartSegments(entry.extractedText).length,
                        isSrt: entry.fileName.toLowerCase().endsWith(".srt"),
                      });
                    }}
                    type="button"
                  >
                    {entry.fileName} ·{" "}
                    {new Date(entry.importedAt).toLocaleTimeString("fr-FR")}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="text-[11px] text-muted-foreground">
            Compteur cloud 500 caractères: {Math.min(rawTextLength, 500)}/500 · Texte brut: {rawTextLength} · Marqueurs: {markerCount} · Segments: {activeUnits.length}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${cloudUsagePercent < 65 ? "bg-emerald-500" : cloudUsagePercent < 90 ? "bg-orange-500" : "bg-red-500"}`}
              style={{ width: `${cloudUsagePercent}%` }}
            />
          </div>

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
              Voix par défaut
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
                onChange={(event) => setVoiceStyle(event.target.value as VoiceStyle)}
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
                onChange={(event) => setVoiceGender(event.target.value as "homme" | "femme")}
                value={voiceGender}
              >
                <option value="femme">Femme</option>
                <option value="homme">Homme</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs md:col-span-1">
              Format final
              <select
                className="mt-1 w-full rounded-lg border border-border/50 bg-background px-2 py-2 text-xs"
                onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
                value={outputFormat}
              >
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
              </select>
            </label>
            <label className="text-xs md:col-span-1">
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

            <label className="text-xs md:col-span-1">
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
            Vitesse/ton appliqués au playback (taux effectif: {effectiveRate.toFixed(2)}x).
          </p>

          <div className="rounded-xl border border-border/50 bg-background/40 p-3">
            <p className="mb-2 text-xs font-semibold text-foreground">Créateur de profil vocal avancé</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs">
                Mots à emphase (séparés par virgule)
                <input
                  className="mt-1 w-full rounded-lg border border-border/50 bg-background px-2 py-2 text-xs"
                  onChange={(event) =>
                    setAdvancedProfile((current) => ({
                      ...current,
                      emphasisWords: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="important, urgent, now"
                  value={advancedProfile.emphasisWords.join(", ")}
                />
              </label>
              <label className="text-xs">
                Pause inter-phrases ({advancedProfile.pauseSeconds.toFixed(1)}s)
                <input
                  className="mt-1 w-full"
                  max={2}
                  min={0}
                  onChange={(event) =>
                    setAdvancedProfile((current) => ({
                      ...current,
                      pauseSeconds: Number(event.target.value),
                    }))
                  }
                  step={0.1}
                  type="range"
                  value={advancedProfile.pauseSeconds}
                />
              </label>
              <label className="text-xs md:col-span-2">
                Volume relatif ({advancedProfile.volume.toFixed(2)}x)
                <input
                  className="mt-1 w-full"
                  max={1.5}
                  min={0.5}
                  onChange={(event) =>
                    setAdvancedProfile((current) => ({
                      ...current,
                      volume: Number(event.target.value),
                    }))
                  }
                  step={0.05}
                  type="range"
                  value={advancedProfile.volume}
                />
              </label>
            </div>
          </div>

          {isGenerating ? (
            <div className="rounded-xl border border-border/50 bg-background/40 p-2 text-xs">
              <p>
                Segment {progress.completed}/{progress.total} · {progress.percent}%
              </p>
              <p className="text-[11px] text-muted-foreground">Temps restant estimé: ~{progress.etaSec}s</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-cyan-500 transition-all" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-xs text-white disabled:opacity-60"
              disabled={isGenerating}
              onClick={generateBatchAudio}
              type="button"
            >
              {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
              {mode === "podcast" ? "Générer podcast" : "Générer par lot"}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs disabled:opacity-50"
              disabled={!isGenerating}
              onClick={togglePause}
              type="button"
            >
              {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              {isPaused ? "Reprendre" : "Pause"}
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
              onClick={previewFiveSeconds}
              type="button"
            >
              <Play className="size-3.5" />
              Pré-écoute 5s
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
          <div className="mb-4 rounded-xl border border-border/50 bg-background/40 p-2">
            <p className="mb-2 text-xs font-semibold text-foreground">Bibliothèque de presets</p>
            <div className="mb-2 flex gap-2">
              <input
                className="w-full rounded-lg border border-border/50 bg-background px-2 py-1 text-xs"
                onChange={(event) => setPresetTitle(event.target.value)}
                placeholder="Nom du preset (ex: Narration livre audio)"
                value={presetTitle}
              />
              <button
                className="rounded-lg border px-2 py-1 text-[11px]"
                onClick={saveCurrentAsPreset}
                type="button"
              >
                Sauver
              </button>
            </div>

            <p className="mb-1 text-[11px] font-medium text-foreground">Mes presets</p>
            <div className="max-h-36 space-y-1 overflow-auto">
              {personalPresets.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Aucun preset personnel enregistré.</p>
              ) : (
                personalPresets.map((preset) => (
                  <div className="rounded-lg border border-border/40 p-2" key={preset.id}>
                    <p className="font-medium text-foreground">{preset.title}</p>
                    <p className="text-[11px]">
                      {preset.language.toUpperCase()} · {preset.voice}
                    </p>
                    <div className="mt-1 flex gap-1">
                      <div className="h-1.5 w-16 rounded bg-muted">
                        <div
                          className="h-full rounded bg-cyan-500"
                          style={{ width: `${Math.min(100, (preset.rate / 1.6) * 100)}%` }}
                        />
                      </div>
                      <div className="h-1.5 w-16 rounded bg-muted">
                        <div
                          className="h-full rounded bg-fuchsia-500"
                          style={{ width: `${Math.min(100, ((preset.tone + 6) / 12) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex gap-1">
                      <button className="rounded border px-1" onClick={() => applyPreset(preset)} type="button">
                        Appliquer
                      </button>
                      <button
                        className="rounded border px-1"
                        onClick={() => quickPreviewPreset(preset)}
                        type="button"
                      >
                        {previewingPresetId === preset.id ? "..." : "3s"}
                      </button>
                      <button
                        className="rounded border px-1"
                        onClick={() => exportPresetLink(preset)}
                        type="button"
                      >
                        Export
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="mb-1 mt-3 text-[11px] font-medium text-foreground">
              Presets communautaires
            </p>
            <div className="max-h-48 space-y-2 overflow-auto">
              {(Object.keys(communityPresetsByCategory) as PresetCategory[]).map((category) => (
                <div key={category}>
                  <p className="mb-1 text-[11px] font-medium">{CATEGORY_LABELS[category]}</p>
                  <div className="space-y-1">
                    {communityPresetsByCategory[category].map((preset) => (
                      <div className="rounded-lg border border-border/40 p-2" key={preset.id}>
                        <p className="font-medium text-foreground">{preset.title}</p>
                        <p className="text-[11px]">
                          {preset.language.toUpperCase()} · {preset.voice}
                        </p>
                        <div className="mt-1 flex gap-1">
                          <div className="h-1.5 w-16 rounded bg-muted">
                            <div
                              className="h-full rounded bg-cyan-500"
                              style={{ width: `${Math.min(100, (preset.rate / 1.6) * 100)}%` }}
                            />
                          </div>
                          <div className="h-1.5 w-16 rounded bg-muted">
                            <div
                              className="h-full rounded bg-fuchsia-500"
                              style={{ width: `${Math.min(100, ((preset.tone + 6) / 12) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-2 flex gap-1">
                          <button className="rounded border px-1" onClick={() => applyPreset(preset)} type="button">
                            Appliquer
                          </button>
                          <button
                            className="rounded border px-1"
                            onClick={() => quickPreviewPreset(preset)}
                            type="button"
                          >
                            {previewingPresetId === preset.id ? "..." : "3s"}
                          </button>
                          <button
                            className="rounded border px-1"
                            onClick={() => exportPresetLink(preset)}
                            type="button"
                          >
                            Export
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                style={{ height: `${25 + ((bar * 17) % 65)}%`, animationDelay: `${bar * 45}ms` }}
              />
            ))}
          </div>

          <p>{isGenerating ? (isPaused ? "En pause" : "Génération en cours...") : isPlaying ? "Lecture en cours" : "Prêt"}</p>
          {estimatedDuration ? <p className="mt-1 text-[11px]">Durée estimée : ~{estimatedDuration}s</p> : null}
          {provider ? <p className="mt-1 text-[11px]">Provider: {provider}</p> : null}

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
                  Télécharger {outputFormat.toUpperCase()}
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

          <div className="mt-4 rounded-xl border border-border/50 bg-background/40 p-2">
            <p className="mb-2 text-xs font-semibold text-foreground">Historique des générations</p>
            <div className="max-h-28 space-y-1 overflow-auto">
              {history
                .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
                .slice(0, 8)
                .map((item) => (
                  <div className="rounded-md border border-border/40 px-2 py-1 text-[11px]" key={`${item.createdAt}-${item.voice}`}>
                    <button
                      className="block w-full text-left"
                      onClick={() => {
                        setText(item.text);
                        setVoice(item.voice);
                        setAudioUrl(item.url);
                      }}
                      type="button"
                    >
                      {item.voice} · {new Date(item.createdAt).toLocaleTimeString("fr-FR")}
                    </button>
                    <div className="mt-1 flex gap-1">
                      <button
                        className="rounded border px-1"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = item.url;
                          link.download = `speaky-history-${Date.now()}.mp3`;
                          link.click();
                        }}
                        type="button"
                      >
                        DL
                      </button>
                      <button
                        className="rounded border px-1"
                        onClick={() =>
                          setHistory((prev) =>
                            prev.map((row) =>
                              row.createdAt === item.createdAt ? { ...row, pinned: !row.pinned } : row
                            )
                          )
                        }
                        type="button"
                      >
                        {item.pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        className="rounded border border-red-300 px-1 text-red-500"
                        onClick={() =>
                          setHistory((prev) => prev.filter((row) => row.createdAt !== item.createdAt))
                        }
                        type="button"
                      >
                        Del
                      </button>
                      <button
                        className="rounded border border-cyan-300 px-1 text-cyan-600"
                        onClick={() => publishHistoryItem(item)}
                        type="button"
                      >
                        Public
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
