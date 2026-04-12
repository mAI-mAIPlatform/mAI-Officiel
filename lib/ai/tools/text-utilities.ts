import { tool } from "ai";
import { z } from "zod";

function summarizeText(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 3).join(" ").trim();
}

function extractKeywords(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 5);

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function generatePassword(size: number) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  let output = "";
  for (let index = 0; index < size; index++) {
    output += chars[Math.floor(Math.random() * chars.length)];
  }
  return output;
}

export const textUtilities = tool({
  description:
    "Exécute des utilitaires texte pour l'utilisateur: résumé, mots-clés, nettoyage, slug, mot de passe.",
  inputSchema: z.object({
    action: z.enum(["summarize", "keywords", "clean", "slug", "password"]),
    text: z.string().trim().min(1).max(12_000),
    size: z.number().int().min(8).max(64).optional(),
  }),
  execute: ({ action, text, size }) => {
    const cleaned = text.replace(/\s+/g, " ").trim();

    if (action === "summarize") {
      return {
        effect: "Utilitaire texte",
        action,
        output: summarizeText(cleaned),
      };
    }

    if (action === "keywords") {
      return {
        effect: "Utilitaire texte",
        action,
        output: extractKeywords(cleaned),
      };
    }

    if (action === "slug") {
      return {
        effect: "Utilitaire texte",
        action,
        output: toSlug(cleaned),
      };
    }

    if (action === "password") {
      return {
        effect: "Utilitaire texte",
        action,
        output: generatePassword(size ?? 16),
      };
    }

    return {
      effect: "Utilitaire texte",
      action: "clean",
      output: cleaned,
    };
  },
});
