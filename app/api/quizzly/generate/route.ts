import { generateObject } from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL, chatModels } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

const bodySchema = z.object({
  count: z.number().int().min(1).max(20),
  difficulty: z.string().min(1),
  grade: z.string().min(1),
  modelId: z.string().min(1).optional(),
  subject: z.string().min(1),
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

export async function POST(req: Request) {
  try {
    const payload = bodySchema.safeParse(await req.json());
    if (!payload.success) {
      return Response.json({ error: "Paramètres invalides pour la génération du quiz." }, { status: 400 });
    }

    const { count, difficulty, grade, subject } = payload.data;
    const resolvedModelId = resolveModelId(payload.data.modelId);
    const model = getLanguageModel(resolvedModelId);

    const prompt = `Tu es un professeur expert. Génère ${count} questions à choix multiples (QCM) pour la matière "${subject}", niveau "${grade}", avec une difficulté "${difficulty}".
Chaque question doit avoir 4 propositions, une seule bonne réponse, et une courte explication.
Réponds uniquement avec un JSON valide qui respecte strictement le schéma attendu.`;

    const { object } = await generateObject({
      model,
      schema: outputSchema,
      prompt,
    });

    return Response.json(object);
  } catch (error) {
    console.error("Quiz generation error:", error);
    return Response.json({ error: "Impossible de générer ce quiz pour le moment." }, { status: 500 });
  }
}
