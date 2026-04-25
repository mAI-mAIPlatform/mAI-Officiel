import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/providers";
import { chatModels } from "@/lib/ai/models";

const payloadSchema = z.object({
  message: z.string().trim().min(3).max(12000),
  modelId: z.string().trim().optional(),
});

const validModelIds = new Set(chatModels.map((model) => model.id));
const defaultModelId = "gpt-5.4-mini";

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const modelId =
    parsed.data.modelId && validModelIds.has(parsed.data.modelId)
      ? parsed.data.modelId
      : defaultModelId;

  try {
    const { text } = await generateText({
      model: getLanguageModel(modelId),
      system:
        "Tu es mAIHealth. Tu donnes des informations générales de santé prudentes, structurées et non-diagnostiques. Tu rappelles systématiquement de consulter un professionnel en cas de doute.",
      prompt: `Analyse et réponds avec empathie: ${parsed.data.message}`,
    });

    return NextResponse.json({ analysis: text.trim(), modelId });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'analyser ce message pour le moment." },
      { status: 500 }
    );
  }
}
