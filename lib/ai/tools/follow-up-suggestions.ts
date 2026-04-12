import { tool } from "ai";
import { z } from "zod";

const MAX_WORDS_PER_SUGGESTION = 6;
const MAX_SUGGESTIONS = 3;

const trimToWordLimit = (value: string, maxWords = MAX_WORDS_PER_SUGGESTION) =>
  value.trim().split(/\s+/).slice(0, maxWords).join(" ");

const normalizeSuggestions = (suggestions: string[]) => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawItem of suggestions) {
    const cleanedItem = trimToWordLimit(rawItem.replace(/[.:;!?]+$/g, ""));
    if (cleanedItem.length === 0) {
      continue;
    }
    const fingerprint = cleanedItem.toLowerCase();
    if (seen.has(fingerprint)) {
      continue;
    }
    seen.add(fingerprint);
    normalized.push(cleanedItem);
    if (normalized.length >= MAX_SUGGESTIONS) {
      break;
    }
  }

  return normalized;
};

export const followUpSuggestions = tool({
  description:
    "Generate up to 3 short follow-up prompts based on the current answer context. Keep prompts actionable and user-ready.",
  inputSchema: z.object({
    responseDraft: z
      .string()
      .min(1)
      .max(4000)
      .describe("Draft response used as context to propose follow-up prompts."),
    userLanguage: z
      .string()
      .min(2)
      .max(24)
      .optional()
      .describe(
        "BCP-47 language tag or language name inferred from user prompt."
      ),
  }),
  execute: ({ responseDraft, userLanguage }) => {
    const cleanedDraft = responseDraft.replace(/\s+/g, " ").trim();
    const seed = cleanedDraft
      .split(/[.!?]/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .slice(0, 3);

    const fallbackLanguage = (userLanguage ?? "fr").toLowerCase();
    const defaults = fallbackLanguage.startsWith("fr")
      ? [
          "Donne-moi une version plus concise",
          "Ajoute un exemple concret",
          "Transforme cela en plan d'action",
        ]
      : [
          "Give me a shorter version",
          "Add a concrete example",
          "Turn this into an action plan",
        ];

    const inferred = normalizeSuggestions(
      seed.map((sentence) => {
        const shortSentence = trimToWordLimit(sentence.slice(0, 80), 4);
        return fallbackLanguage.startsWith("fr")
          ? `Approfondir ${shortSentence}`
          : `Go deeper ${shortSentence}`;
      })
    );

    const suggestions = normalizeSuggestions([...inferred, ...defaults]);

    return {
      suggestions,
      markdownHints: suggestions.map(
        (item) => `[${item}](mai-suggest:${encodeURIComponent(item)})`
      ),
    };
  },
});
