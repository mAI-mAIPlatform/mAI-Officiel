import { generateText } from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL, chatModels } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

const bodySchema = z.object({
  question: z.string().min(1).max(600),
  options: z.array(z.string().min(1)).max(6).optional(),
  explanation: z.string().min(1).max(1200).optional(),
  subject: z.string().min(1).max(120),
  difficulty: z.string().min(1).max(80),
  modelId: z.string().min(1).optional(),
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
      return Response.json({ error: "Paramètres d'indice invalides." }, { status: 400 });
    }

    const model = getLanguageModel(resolveModelId(parsed.data.modelId));
    const optionsText = parsed.data.options?.length
      ? `Options disponibles: ${parsed.data.options.join(" | ")}`
      : "Pas d'options fournies (question ouverte).";

    const { text } = await generateText({
      model,
      prompt: `Tu aides un élève bloqué sur une question de quiz.
Matière: ${parsed.data.subject}
Difficulté: ${parsed.data.difficulty}
Question: ${parsed.data.question}
${optionsText}
Explication officielle (référence enseignant): ${parsed.data.explanation ?? "non fournie"}

Rédige un seul paragraphe (50 à 90 mots) qui oriente la réflexion sans jamais donner la réponse exacte,
sans citer la bonne option, sans écrire la première lettre de la réponse.
Utilise soit un contexte historique, soit une règle partielle, soit une analogie pédagogique.`,
    });

    return Response.json({ hint: text.trim() });
  } catch (error) {
    console.error("quizzly hint error", error);
    return Response.json({ error: "Indice IA indisponible pour le moment." }, { status: 500 });
  }
}
