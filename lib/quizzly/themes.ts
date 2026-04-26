export const QUIZZLY_THEME_KEY = "mai.quizzly.theme.v1";
export const QUIZZLY_UNLOCKED_THEMES_KEY = "mai.quizzly.themes.unlocked.v1";

export type QuizzlyThemeId =
  | "classic-light"
  | "classic-dark"
  | "nuit-etoilee"
  | "ocean-profond"
  | "foret-enchantee"
  | "neon-cyberpunk"
  | "pastel-doux"
  | "halloween-citrouille"
  | "noel-flocon";

export type QuizzlyTheme = {
  id: QuizzlyThemeId;
  name: string;
  premium: boolean;
  seasonal?: boolean;
  priceDiamonds?: number;
  dark: boolean;
  vars: {
    bg: string;
    card: string;
    text: string;
    accent: string;
    nav: string;
  };
};

export const quizzlyThemes: QuizzlyTheme[] = [
  { id: "classic-light", name: "Classique Clair", premium: false, dark: false, vars: { bg: "#f8fafc", card: "#ffffff", text: "#0f172a", accent: "#7c3aed", nav: "#ffffff" } },
  { id: "classic-dark", name: "Classique Sombre", premium: false, dark: true, vars: { bg: "#0f1117", card: "#1c2230", text: "#e5e7eb", accent: "#a78bfa", nav: "#171c26" } },
  { id: "nuit-etoilee", name: "Nuit Étoilée", premium: true, priceDiamonds: 140, dark: true, vars: { bg: "#0b1228", card: "#13203f", text: "#f8fafc", accent: "#f59e0b", nav: "#0f1a33" } },
  { id: "ocean-profond", name: "Océan Profond", premium: true, priceDiamonds: 140, dark: true, vars: { bg: "#062b3a", card: "#0d3f52", text: "#e6fffb", accent: "#22d3ee", nav: "#0a3445" } },
  { id: "foret-enchantee", name: "Forêt Enchantée", premium: true, priceDiamonds: 160, dark: true, vars: { bg: "#10281d", card: "#1a3c2c", text: "#f1f5f9", accent: "#34d399", nav: "#142f22" } },
  { id: "neon-cyberpunk", name: "Néon Cyberpunk", premium: true, priceDiamonds: 180, dark: true, vars: { bg: "#08070f", card: "#17142a", text: "#f8fafc", accent: "#f472b6", nav: "#100f1d" } },
  { id: "pastel-doux", name: "Pastel Doux", premium: true, priceDiamonds: 120, dark: false, vars: { bg: "#fff7fb", card: "#ffffff", text: "#475569", accent: "#a78bfa", nav: "#fff1f8" } },
  { id: "halloween-citrouille", name: "Citrouille (Saisonnier)", premium: true, seasonal: true, priceDiamonds: 200, dark: true, vars: { bg: "#24140d", card: "#3a2217", text: "#fff7ed", accent: "#fb923c", nav: "#2d1a12" } },
  { id: "noel-flocon", name: "Flocon (Saisonnier)", premium: true, seasonal: true, priceDiamonds: 200, dark: false, vars: { bg: "#eef8ff", card: "#ffffff", text: "#0f172a", accent: "#38bdf8", nav: "#f0f9ff" } },
];

export function getThemeById(id: string) {
  return quizzlyThemes.find((theme) => theme.id === id) ?? quizzlyThemes[0];
}
