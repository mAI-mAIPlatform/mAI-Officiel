import { generateDummyPassword } from "./db/utils";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

export const greetingPrompts = [
  "Comment puis-je vous aider aujourd'hui ?",
  "Que voulez-vous construire avec mAI ?",
  "Par quoi commençons-nous aujourd'hui ?",
  "Quelle idée voulez-vous explorer maintenant ?",
] as const;

export const suggestions = [
  "Rédige un plan projet pour lancer une nouvelle fonctionnalité IA.",
  "Crée un résumé des actions à faire cette semaine avec priorités.",
  "Aide-moi à structurer une base de connaissances pour mon équipe.",
  "Propose 5 idées de contenu pour présenter mon produit en français.",
];

export function getRotatingText(options: readonly string[]) {
  if (!options.length) {
    return "";
  }

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86_400_000
  );

  return options[dayOfYear % options.length] ?? options[0];
}
