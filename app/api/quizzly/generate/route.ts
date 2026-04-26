import { generateObject } from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL, chatModels } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

const bodySchema = z.object({
  chapter: z.string().min(1).optional(),
  count: z.number().int().min(1).max(20),
  difficulty: z.string().min(1),
  grade: z.string().min(1),
  modelId: z.string().min(1).optional(),
  subject: z.string().min(1),
  themePrompt: z.string().max(500).optional(),
});

const outputSchema = z.object({
  questions: z.array(
    z.object({
      correctAnswerIndex: z.number().int().min(0).max(3),
      explanation: z.string().min(1),
      options: z.array(z.string().min(1)).length(4),
      question: z.string().min(1),
    })
  ),
});

type NormalizedQuestion = {
  correctAnswerIndex: number;
  explanation: string;
  options: string[];
  question: string;
};

function resolveModelId(rawModelId?: string): string {
  const available = new Set(chatModels.map((model) => model.id));
  if (!rawModelId) {
    return DEFAULT_CHAT_MODEL;
  }

  const trimmed = rawModelId.trim();
  if (available.has(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("openai/")) {
    const withoutPrefix = trimmed.slice("openai/".length);
    if (available.has(withoutPrefix)) {
      return withoutPrefix;
    }
  }

  return trimmed;
}

function sanitizeQuestion(raw: any): NormalizedQuestion | null {
  const question = String(raw?.question ?? raw?.enonce ?? "").trim();
  const optionsRaw = raw?.options ?? raw?.propositions ?? raw?.choices;
  const explanation = String(raw?.explanation ?? raw?.explication ?? "").trim();
  const answerIndexRaw = raw?.correctAnswerIndex ?? raw?.bonneReponseIndex;
  const answerText = String(raw?.bonne_reponse ?? raw?.bonneReponse ?? raw?.correctAnswer ?? "").trim();

  const extractOptionLabel = (value: unknown): string => {
    if (typeof value === "string") return value.trim();
    if (value && typeof value === "object") {
      const textCandidate =
        (value as { text?: unknown }).text ??
        (value as { label?: unknown }).label ??
        (value as { option?: unknown }).option;
      if (typeof textCandidate === "string") return textCandidate.trim();
    }
    return String(value ?? "").trim();
  };

  const optionsFromObject =
    optionsRaw && typeof optionsRaw === "object" && !Array.isArray(optionsRaw)
      ? ["A", "B", "C", "D"]
          .map((key) => optionsRaw[key])
          .map((value) => extractOptionLabel(value))
          .filter((value) => value.length > 0)
      : [];

  const normalizedOptionsRaw = Array.isArray(optionsRaw)
    ? optionsRaw
    : optionsFromObject;

  if (
    !question ||
    !Array.isArray(normalizedOptionsRaw) ||
    normalizedOptionsRaw.length !== 4 ||
    !explanation
  ) {
    return null;
  }

  const options = normalizedOptionsRaw
    .map((option: unknown) => extractOptionLabel(option))
    .filter((option) => option.length > 0);

  if (options.length !== 4) {
    return null;
  }
  const answerFromLetter =
    answerText.length === 1 &&
    ["A", "B", "C", "D"].includes(answerText.toUpperCase())
      ? answerText.toUpperCase().charCodeAt(0) - "A".charCodeAt(0)
      : -1;

  let correctAnswerIndex = Number.isInteger(answerIndexRaw)
    ? Number(answerIndexRaw)
    : answerFromLetter >= 0
      ? answerFromLetter
      : options.findIndex((option) => option === answerText);

  if (correctAnswerIndex < 0 || correctAnswerIndex > 3) {
    correctAnswerIndex = 0;
  }

  return {
    correctAnswerIndex,
    explanation,
    options,
    question,
  };
}

function normalizePossibleQuizPayload(payload: any) {
  const questionsRaw = payload?.questions;
  if (!Array.isArray(questionsRaw)) {
    return null;
  }

  const questions = questionsRaw
    .map(sanitizeQuestion)
    .filter((question): question is NormalizedQuestion => Boolean(question));

  if (questions.length === 0) {
    return null;
  }

  return { questions };
}

export async function POST(req: Request) {
  try {
    const payload = bodySchema.safeParse(await req.json());
    if (!payload.success) {
      return Response.json({ error: "Paramètres invalides pour la génération du quiz." }, { status: 400 });
    }

    const { chapter, count, difficulty, grade, subject, themePrompt } = payload.data;
    const resolvedModelId = resolveModelId(payload.data.modelId);
    const model = getLanguageModel(resolvedModelId);

    const prompt = `Tu es un professeur expert. Génère ${count} questions à choix multiples (QCM) pour la matière "${subject}", niveau "${grade}", difficulté "${difficulty}".
Chapitre ciblé: "${chapter ?? "général"}".
Thème personnalisé utilisateur: "${themePrompt ?? "aucun"}".
Chaque question doit avoir 4 propositions, une seule bonne réponse, et une courte explication.
Réponds uniquement avec un JSON valide qui respecte strictement le schéma attendu.`;

    try {
      const { object } = await generateObject({
        model,
        schema: outputSchema,
        prompt,
      });
      return Response.json(object);
    } catch (error) {
      const rawText =
        typeof error === "object" && error !== null && "text" in error
          ? String((error as { text?: unknown }).text ?? "")
          : "";

      if (!rawText.trim()) {
        throw error;
      }

      const parsed = JSON.parse(rawText) as unknown;
      const normalized = normalizePossibleQuizPayload(parsed);
      if (!normalized) {
        throw error;
      }

      const validated = outputSchema.safeParse(normalized);
      if (!validated.success) {
        throw error;
      }

      return Response.json(validated.data);
    }
  } catch (error) {
    console.error("Quiz generation error:", error);
    return Response.json({ error: "Impossible de générer ce quiz pour le moment." }, { status: 500 });
  }
}
