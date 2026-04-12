import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { z } from "zod";

const VOICE_BY_LANGUAGE = {
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
} as const;

const supportedLanguages = Object.keys(VOICE_BY_LANGUAGE);

const SpeakyRequestSchema = z.object({
  text: z.string().trim().min(1).max(500),
  language: z.string().trim().min(2).max(8).default("fr"),
  voice: z.string().trim().min(2).max(32).optional(),
});

function resolveVoice(language: string, requestedVoice?: string) {
  const normalizedLanguage = language.toLowerCase().slice(0, 2);
  const voices = (VOICE_BY_LANGUAGE[
    normalizedLanguage as keyof typeof VOICE_BY_LANGUAGE
  ] ?? VOICE_BY_LANGUAGE.fr) as readonly string[];

  if (requestedVoice && voices.includes(requestedVoice)) {
    return requestedVoice;
  }

  return voices[0];
}

async function fetchStreamElementsAudio(text: string, voice: string) {
  const url = new URL("https://api.streamelements.com/kappa/v2/speech");
  url.searchParams.set("voice", voice);
  url.searchParams.set("text", text);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "mAI-Speaky/1.0",
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Provider StreamElements indisponible (${response.status}): ${details.slice(0, 140)}`
    );
  }

  return response.arrayBuffer();
}

async function fetchGoogleAudio(text: string, language: string) {
  const ttsUrl = new URL("https://translate.google.com/translate_tts");
  ttsUrl.searchParams.set("ie", "UTF-8");
  ttsUrl.searchParams.set("client", "tw-ob");
  ttsUrl.searchParams.set("tl", language);
  ttsUrl.searchParams.set("q", text);

  const response = await fetch(ttsUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Provider Google TTS indisponible (${response.status}): ${details.slice(0, 140)}`
    );
  }

  return response.arrayBuffer();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SpeakyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Paramètres invalides (texte 1-500 caractères, langue et voix optionnelle).",
          supportedLanguages,
        },
        { status: 400 }
      );
    }

    const { language, text, voice } = parsed.data;
    const selectedVoice = resolveVoice(language, voice);

    let arrayBuffer: ArrayBuffer;
    let provider = "streamelements";

    try {
      arrayBuffer = await fetchStreamElementsAudio(text, selectedVoice);
    } catch {
      arrayBuffer = await fetchGoogleAudio(text, language);
      provider = "public-google-tts-fallback";
    }

    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      audioBase64,
      contentType: "audio/mpeg",
      durationEstimateSec: Math.ceil(text.length / 12),
      provider,
      selectedVoice,
      supportedLanguages,
      suggestedVoices:
        VOICE_BY_LANGUAGE[
          language.toLowerCase().slice(0, 2) as keyof typeof VOICE_BY_LANGUAGE
        ] ?? VOICE_BY_LANGUAGE.fr,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur serveur Speaky",
      },
      { status: 500 }
    );
  }
}
