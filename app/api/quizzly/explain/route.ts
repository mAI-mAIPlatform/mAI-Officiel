import { generateObject } from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL, chatModels } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

const bodySchema = z.object({
  question: z.string().min(1).max(600),
  options: z.array(z.string().min(1)).length(4),
  correctAnswerIndex: z.number().int().min(0).max(3),
  selectedAnswerIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1).max(1200).optional(),
  subject: z.string().min(1).max(120),
  difficulty: z.string().min(1).max(80),
  modelId: z.string().min(1).optional(),
});

const outputSchema = z.object({
  title: z.string().min(3).max(140),
  explanationCard: z.string().min(80).max(900),
  whyOthersWrong: z.string().min(40).max(700),
  deepDive: z.string().min(150).max(1800),
});

function resolveModelId(rawModelId?: string): string {
  const available = new Set(chatModels.map((model) => model.id));
  if (!rawModelId) return DEFAULT_CHAT_MODEL;
  const trimmed = rawModelId.trim();
  if (available.has(trimmed)) return trimmed;
  if (trimmed.startsWith("openai/")) {
    const withoutPrefix = trimmed.slice("openai/".length);
    if (available.has(withoutPrefix)) return withoutPrefix;
  }
  return DEFAULT_CHAT_MODEL;
}

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Paramètres d'explication invalides." }, { status: 400 });
    }

    const model = getLanguageModel(resolveModelId(parsed.data.modelId));
    const isCorrect = parsed.data.selectedAnswerIndex === parsed.data.correctAnswerIndex;

    const { object } = await generateObject({
      model,
      schema: outputSchema,
      prompt: `Tu es un tuteur pédagogique.
Matière: ${parsed.data.subject}
Difficulté: ${parsed.data.difficulty}
Question: ${parsed.data.question}
Options: ${parsed.data.options.map((option, index) => `${index + 1}) ${option}`).join(" | ")}
Bonne réponse: ${parsed.data.options[parsed.data.correctAnswerIndex]}
Réponse élève: ${parsed.data.options[parsed.data.selectedAnswerIndex]}
Réponse élève correcte: ${isCorrect ? "oui" : "non"}
Explication de base prof: ${parsed.data.explanation ?? "non fournie"}

Constrains:
- title: titre court qui reprend le sujet de la question.
- explanationCard: paragraphe clair sur la logique de la bonne réponse, avec règle/formule/théorème/contexte/principe adapté à la matière.
- whyOthersWrong: si l'élève a faux, explique pourquoi les autres options sont incorrectes; si l'élève a bon, fais un mini rappel comparatif des pièges fréquents.
- deepDive: mini-cours d'environ 200 mots avec exemples concrets et cas d'usage.
- Ne donne aucun format markdown.`
    });

    return Response.json(object);
  } catch (error) {
    console.error("quizzly explain error", error);
    return Response.json({ error: "Explication IA indisponible pour le moment." }, { status: 500 });
  }
}
