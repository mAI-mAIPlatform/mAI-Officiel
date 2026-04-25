import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { chatModels } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

const payloadSchema = z.object({
  classe: z.string().trim().min(2).max(24),
  difficulty: z.enum(["facile", "moyen", "difficile"]),
  matiere: z.string().trim().min(2).max(60),
  modelId: z.string().trim().optional(),
  questionCount: z.number().int().min(5).max(20).default(10),
});

const validModelIds = new Set(chatModels.map((model) => model.id));

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const modelId =
    parsed.data.modelId && validModelIds.has(parsed.data.modelId)
      ? parsed.data.modelId
      : "gpt-5.4-mini";

  try {
    const { text } = await generateText({
      model: getLanguageModel(modelId),
      system:
        "Tu es Quizzly. Génère uniquement un JSON valide avec un tableau questions[]. Chaque entrée: question, choices[4], answerIndex (0-3), explanation courte.",
      prompt: `Matière: ${parsed.data.matiere}\nClasse: ${parsed.data.classe}\nDifficulté: ${parsed.data.difficulty}\nNombre: ${parsed.data.questionCount}`,
    });

    return NextResponse.json({ modelId, raw: text });
  } catch {
    return NextResponse.json({ error: "Impossible de générer le quiz." }, { status: 500 });
  }
}
