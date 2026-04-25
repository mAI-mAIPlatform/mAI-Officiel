import { generateObject } from "ai";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/providers";

const requestSchema = z.object({
  count: z.number().int().min(2).max(30),
  difficulty: z.string().min(1).max(40),
  timer: z.number().int().min(1).max(120),
  topic: z.string().min(1).max(120),
});

const questionSchema = z.object({
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1).max(400),
  options: z.array(z.string().min(1).max(200)).length(4),
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

    const result = await generateObject({
      model: getLanguageModel("openai/gpt-5.4-nano"),
      schema: quizSchema,
      system:
        "Tu es un créateur de quiz interactifs. Réponds uniquement avec un JSON valide respectant strictement le schéma demandé.",
      prompt: `Génère un quiz de ${count} questions sur le sujet "${topic}" avec difficulté "${difficulty}".
Le quiz est chronométré sur ${timer} minutes.
Contraintes:
- 4 choix par question
- 1 seule bonne réponse (index 0 à 3)
- explication courte et utile
- évite les doublons.`,
      temperature: 0.4,
    });

    return Response.json({
      generatedBy: "ai",
      questions: result.object.questions,
    });
  } catch {
    return Response.json(
      { error: "Impossible de générer le quiz pour le moment." },
      { status: 500 }
    );
  }
}
