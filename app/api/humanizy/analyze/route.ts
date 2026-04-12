import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  text: z.string().trim().min(40).max(15_000),
});

const aiPhrases = [
  "en conclusion",
  "il est important de noter",
  "dans l'ensemble",
  "cependant",
  "par ailleurs",
  "de plus",
  "en outre",
];

function analyzeHumanVsAi(text: string) {
  const normalized = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);

  const avgSentenceLength = words.length / Math.max(1, sentences.length);
  const punctuationDensity =
    (text.match(/[,:;]/g)?.length ?? 0) / Math.max(1, words.length);
  const aiPhraseHits = aiPhrases.reduce(
    (count, phrase) => count + (normalized.includes(phrase) ? 1 : 0),
    0
  );
  const repeatedStarts = new Set(
    sentences
      .map((item) => item.trim().split(" ")[0]?.toLowerCase())
      .filter(Boolean)
  );

  let iaScore = 35;
  const signals: string[] = [];

  if (avgSentenceLength > 24) {
    iaScore += 18;
    signals.push("Phrases longues et structurées de manière homogène.");
  } else {
    iaScore -= 8;
    signals.push(
      "Variété de longueur de phrases compatible avec l'écriture humaine."
    );
  }

  if (punctuationDensity > 0.11) {
    iaScore += 10;
    signals.push("Densité de ponctuation élevée (style formel). ");
  }

  if (aiPhraseHits > 1) {
    iaScore += 20;
    signals.push(
      "Présence de connecteurs rhétoriques fréquents des générations IA."
    );
  }

  if (repeatedStarts.size <= Math.max(2, sentences.length / 4)) {
    iaScore += 14;
    signals.push("Débuts de phrases peu diversifiés.");
  } else {
    iaScore -= 6;
    signals.push("Débuts de phrases variés (trace humaine). ");
  }

  const confidence = Math.max(1, Math.min(99, Math.round(iaScore)));

  return {
    label: confidence >= 55 ? "IA" : "Humain",
    confidence,
    explanation:
      confidence >= 55
        ? "Le texte présente plusieurs patterns souvent associés aux contenus générés par IA."
        : "Le texte montre des irrégularités et nuances typiques d'une écriture humaine.",
    signals,
  } as const;
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  return NextResponse.json(analyzeHumanVsAi(parsed.data.text));
}
