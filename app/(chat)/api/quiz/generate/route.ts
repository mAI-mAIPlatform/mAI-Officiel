import { z } from "zod";
import { generateResponse } from "@/lib/ai/external-providers";

const requestSchema = z.object({
  count: z.number().int().min(2).max(30),
  difficulty: z.string().min(1).max(40),
  timer: z.number().int().min(1).max(120),
  topic: z.string().min(1).max(120),
});

const questionSchema = z.object({
  answerGuide: z.string().min(1).max(500),
  id: z.string().min(1).max(64),
  question: z.string().min(1).max(300),
});

const quizSchema = z.object({
  questions: z.array(questionSchema).min(2).max(30),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Paramètres quiz invalides." },
        { status: 400 }
      );
    }

    const { topic, difficulty, count, timer } = parsed.data;

    const { text } = await generateResponse({
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "user",
          content: `Génère un quiz à réponse libre de ${count} questions sur le sujet "${topic}" avec difficulté "${difficulty}".
Le quiz est chronométré sur ${timer} minutes.
Contraintes:
- chaque question doit être formulée clairement pour une réponse manuelle
- ajoute un guide de correction synthétique (réponse attendue en 1 à 3 phrases)
- évite les doublons.
- ne révèle pas les réponses dans l'énoncé de la question.

Réponds UNIQUEMENT en JSON valide au format:
{"questions":[{"id":"q1","question":"...","answerGuide":"..."}]}`,
        },
      ],
      systemInstruction:
        "Tu es un créateur de quiz interactifs. La sortie doit être strictement un JSON parseable, sans markdown.",
    });

    const trimmed = text.trim();
    const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
    const jsonCandidate = fencedMatch?.[1]?.trim()
      ? fencedMatch[1].trim()
      : trimmed.startsWith("{") && trimmed.endsWith("}")
        ? trimmed
        : (trimmed.match(/\{[\s\S]*\}/)?.[0] ?? "");

    if (!jsonCandidate) {
      return Response.json(
        { error: "La génération IA a renvoyé un format invalide." },
        { status: 502 }
      );
    }

    let parsedQuiz: unknown;
    try {
      parsedQuiz = JSON.parse(jsonCandidate);
    } catch {
      return Response.json(
        { error: "Impossible d'analyser le JSON du quiz IA." },
        { status: 502 }
      );
    }

    const validatedQuiz = quizSchema.safeParse(parsedQuiz);
    if (!validatedQuiz.success) {
      return Response.json(
        { error: "Le quiz généré ne respecte pas le schéma attendu." },
        { status: 502 }
      );
    }

    return Response.json({ generatedBy: "ai", questions: validatedQuiz.data.questions });
  } catch {
    return Response.json(
      { error: "Impossible de générer le quiz pour le moment." },
      { status: 500 }
    );
  }
}
