import { generateObject } from "ai";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/providers";

export async function POST(req: Request) {
  try {
    // we use a dummy user logic because getUser takes an email argument which we might not have in route
    // but in a real scenario we'd use NextAuth
    // const user = await getUser();

    const { subject, grade, difficulty, count, modelId } = await req.json();

    if (!subject || !grade || !difficulty || !count || !modelId) {
      return new Response("Missing parameters", { status: 400 });
    }

    const model = getLanguageModel(modelId);

    const prompt = `Tu es un professeur expert. Génère ${count} questions à choix multiples (QCM) pour la matière "${subject}", niveau "${grade}", avec une difficulté "${difficulty}".
    Chaque question doit avoir 4 propositions, une seule bonne réponse, et une courte explication.`;

    const { object } = await generateObject({
      model,
      schema: z.object({
        questions: z.array(
          z.object({
            question: z.string().describe("La question posée"),
            options: z.array(z.string()).length(4).describe("Les 4 choix possibles"),
            correctAnswerIndex: z.number().min(0).max(3).describe("L'index de la bonne réponse (0 à 3)"),
            explanation: z.string().describe("L'explication de la bonne réponse"),
          })
        ),
      }),
      prompt,
    });

    return new Response(JSON.stringify(object), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Quiz generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
