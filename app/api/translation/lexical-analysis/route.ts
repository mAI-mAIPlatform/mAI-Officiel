import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/providers";

const payloadSchema = z.object({
  text: z.string().trim().min(1).max(8000),
});

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { text } = await generateText({
      model: getLanguageModel("openai/gpt-5.4-nano"),
      system:
        "Tu es un assistant linguistique. Donne une analyse lexicale courte (4 phrases max), claire et actionnable.",
      prompt: `Analyse ce texte traduit en français simple: ${parsed.data.text}`,
    });

    return NextResponse.json({ analysis: text.trim() });
  } catch {
    return NextResponse.json(
      { error: "Impossible de générer l'analyse IA" },
      { status: 500 }
    );
  }
}
