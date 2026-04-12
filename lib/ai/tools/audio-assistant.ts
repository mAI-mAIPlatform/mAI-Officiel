import { tool } from "ai";
import { z } from "zod";

const voiceMapByLanguage: Record<string, { femme: string; homme: string }> = {
  de: { femme: "Marlene", homme: "Hans" },
  en: { femme: "Joanna", homme: "Brian" },
  es: { femme: "Lucia", homme: "Enrique" },
  fr: { femme: "Lea", homme: "Mathieu" },
  it: { femme: "Carla", homme: "Giorgio" },
  ja: { femme: "Mizuki", homme: "Takumi" },
  nl: { femme: "Lotte", homme: "Ruben" },
  pl: { femme: "Maja", homme: "Jacek" },
  pt: { femme: "Camila", homme: "Ricardo" },
  ru: { femme: "Tatyana", homme: "Maxim" },
};

export const audioAssistant = tool({
  description:
    "Prépare un pack audio pour Speaky (script nettoyé, voix, style, durée estimée) pour ensuite générer un audio.",
  inputSchema: z.object({
    language: z.string().trim().min(2).max(8).default("fr"),
    text: z.string().trim().min(1).max(3000),
    voiceGender: z.enum(["homme", "femme"]).default("femme"),
    voiceStyle: z
      .enum(["narratif", "conversationnel", "énergique"])
      .default("narratif"),
  }),
  execute: ({ text, language, voiceGender, voiceStyle }) => {
    const normalizedLanguage = language.toLowerCase().slice(0, 2);
    const selectedVoice =
      voiceMapByLanguage[normalizedLanguage]?.[voiceGender] ??
      voiceMapByLanguage.fr.femme;

    const normalizedText = text.replace(/\s+/g, " ").trim();
    const chunks = normalizedText.match(/[^.!?]+[.!?]?/g) ?? [normalizedText];
    const estimatedDurationSec = Math.max(
      1,
      Math.ceil(normalizedText.length / 13)
    );

    return {
      effect: "Connexion Speaky",
      guidance:
        "Utilise ce pack pour appeler /api/speaky côté interface et générer un MP3.",
      payload: {
        language: normalizedLanguage,
        text: normalizedText,
        voice: selectedVoice,
        voiceGender,
        voiceStyle,
      },
      chunks,
      estimatedDurationSec,
      qualityTips: [
        "Limiter un bloc à 500 caractères pour la génération cloud.",
        "Ajouter de la ponctuation pour des pauses naturelles.",
      ],
    };
  },
});
