import { z } from "zod";
import { generateResponse } from "@/lib/ai/external-providers";

const correctionRequestSchema = z.object({
  difficulty: z.string().min(1).max(40),
  questions: z
    .array(
      z.object({
        answerGuide: z.string().min(1).max(500),
        id: z.string().min(1).max(64),
        question: z.string().min(1).max(300),
      })
    )
    .min(2)
    .max(30),
  topic: z.string().min(1).max(120),
  userAnswers: z.record(z.string().min(1).max(64), z.string().max(2000)),
});

const correctionResultSchema = z.object({
  feedback: z.string().min(1).max(600),
  id: z.string().min(1).max(64),
  isCorrect: z.boolean(),
  score: z.number().min(0).max(1),
});

const correctionResponseSchema = z.object({
  corrections: z.array(correctionResultSchema).min(2).max(30),
  globalFeedback: z.string().min(1).max(1200),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsedPayload = correctionRequestSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return Response.json({ error: "Paramètres de correction invalides." }, { status: 400 });
    }

    const { difficulty, questions, topic, userAnswers } = parsedPayload.data;
    const serializedInput = questions.map((question) => ({
      answerGuide: question.answerGuide,
      id: question.id,
      question: question.question,
      userAnswer: userAnswers[question.id] ?? "",
    }));

    const { text } = await generateResponse({
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "user",
          content: `Corrige ce quiz "${topic}" (difficulté ${difficulty}).
Réponds UNIQUEMENT en JSON au format:
{"corrections":[{"id":"q1","isCorrect":true,"score":1,"feedback":"..."}],"globalFeedback":"..."}

Règles:
- score entre 0 et 1 par question
- feedback court, concret et pédagogique
- ne pas inventer de questions.

Données de correction:
${JSON.stringify(serializedInput)}`,
        },
      ],
      systemInstruction:
        "Tu es un correcteur pédagogique strict. Tu renvoies uniquement du JSON parseable.",
    });

    const trimmed = text.trim();
    const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
    const jsonCandidate = fencedMatch?.[1]?.trim()
      ? fencedMatch[1].trim()
      : trimmed.startsWith("{") && trimmed.endsWith("}")
        ? trimmed
        : (trimmed.match(/\{[\s\S]*\}/)?.[0] ?? "");

    if (!jsonCandidate) {
      return Response.json({ error: "Format de correction IA invalide." }, { status: 502 });
    }

    let parsedCorrection: unknown;
    try {
      parsedCorrection = JSON.parse(jsonCandidate);
    } catch {
      return Response.json({ error: "JSON de correction IA invalide." }, { status: 502 });
    }

    const validatedCorrection = correctionResponseSchema.safeParse(parsedCorrection);
    if (!validatedCorrection.success) {
      return Response.json({ error: "Correction IA incomplète." }, { status: 502 });
    }

    return Response.json(validatedCorrection.data);
  } catch {
    return Response.json({ error: "Impossible de corriger le quiz pour le moment." }, { status: 500 });
  }
}
