import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/providers";
import { chatModels } from "@/lib/ai/models";

const payloadSchema = z.object({
  category: z.enum(["Plat", "Entrée", "Dessert"]),
  description: z.string().trim().min(3).max(1200),
  includeIngredients: z.array(z.string().trim().min(1)).max(40).default([]),
  excludeIngredients: z.array(z.string().trim().min(1)).max(40).default([]),
  maxPreparationMinutes: z.number().int().min(5).max(600),
  servings: z.number().int().min(1).max(20),
  thermomixMode: z.boolean().default(false),
  refinement: z.enum(["none", "simple", "light", "gourmet"]).default("none"),
  modelId: z.string().trim().optional(),
});

const validModelIds = new Set(chatModels.map((model) => model.id));
const defaultModelId = "gpt-5.5";

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const modelId =
    parsed.data.modelId && validModelIds.has(parsed.data.modelId)
      ? parsed.data.modelId
      : defaultModelId;

  const { category, description, excludeIngredients, includeIngredients, maxPreparationMinutes, servings, thermomixMode, refinement } = parsed.data;

  try {
    const { text } = await generateText({
      model: getLanguageModel(modelId),
      system:
        "Tu es Cooker, un chef IA exigeant. Génère une recette fiable, claire, complète, sûre et mesurée. Réponds en français markdown. N'ajoute aucune question de suivi.",
      prompt: [
        `Type: ${category}`,
        `Description: ${description}`,
        `Ingrédients à inclure: ${includeIngredients.join(", ") || "aucun"}`,
        `Ingrédients à exclure: ${excludeIngredients.join(", ") || "aucun"}`,
        `Temps total maximum: ${maxPreparationMinutes} minutes`,
        `Portions: ${servings}`,
        `Mode Thermomix: ${thermomixMode ? "oui" : "non"}`,
        `Niveau de simplification: ${refinement}`,
        "Format attendu: titre, résumé, ingrédients détaillés avec quantités, étapes numérotées, timings précis, variantes, conseils de conservation.",
      ].join("\n"),
    });

    return NextResponse.json({ recipe: text.trim(), modelId });
  } catch {
    return NextResponse.json(
      { error: "Impossible de générer la recette pour le moment." },
      { status: 500 }
    );
  }
}
