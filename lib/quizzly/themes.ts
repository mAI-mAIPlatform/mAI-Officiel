export const QUIZZLY_THEME_KEY = "mai.quizzly.theme.v1";
export const QUIZZLY_UNLOCKED_THEMES_KEY = "mai.quizzly.themes.unlocked.v1";
export const QUIZZLY_THEME_EVENT = "mai:quizzly-theme";

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
  availabilityMonths?: number[];
  priceDiamonds?: number;
  dark: boolean;
  shopItemKey: string;
  vars: {
    bg: string;
    card: string;
    cardAlt: string;
    text: string;
    textMuted: string;
    accent: string;
    border: string;
    button: string;
    buttonText: string;
    buttonSoft: string;
    buttonSoftText: string;
    nav: string;
  };
};

export const quizzlyThemes: QuizzlyTheme[] = [
  { id: "classic-light", name: "Classique Clair", premium: false, dark: false, shopItemKey: "theme:classic-light", vars: { bg: "#f8fafc", card: "#ffffff", cardAlt: "#f1f5f9", text: "#0f172a", textMuted: "#64748b", accent: "#7c3aed", border: "#e2e8f0", button: "#6d28d9", buttonText: "#f8fafc", buttonSoft: "#ede9fe", buttonSoftText: "#5b21b6", nav: "#ffffff" } },
  { id: "classic-dark", name: "Classique Sombre", premium: false, dark: true, shopItemKey: "theme:classic-dark", vars: { bg: "#11131a", card: "#1f2533", cardAlt: "#171c26", text: "#f1f5f9", textMuted: "#cbd5e1", accent: "#a78bfa", border: "#334155", button: "#8b5cf6", buttonText: "#f8fafc", buttonSoft: "#2a3345", buttonSoftText: "#ddd6fe", nav: "#171c26" } },
  { id: "nuit-etoilee", name: "Nuit Étoilée", premium: true, priceDiamonds: 140, dark: true, shopItemKey: "theme:nuit-etoilee", vars: { bg: "#0b1228", card: "#13203f", cardAlt: "#0f1a33", text: "#f8fafc", textMuted: "#bfdbfe", accent: "#f59e0b", border: "#31477a", button: "#f59e0b", buttonText: "#1f2937", buttonSoft: "#1e2d54", buttonSoftText: "#fde68a", nav: "#0f1a33" } },
  { id: "ocean-profond", name: "Océan Profond", premium: true, priceDiamonds: 140, dark: true, shopItemKey: "theme:ocean-profond", vars: { bg: "#062b3a", card: "#0d3f52", cardAlt: "#0a3445", text: "#e6fffb", textMuted: "#a5f3fc", accent: "#22d3ee", border: "#1f5669", button: "#0891b2", buttonText: "#ecfeff", buttonSoft: "#12495d", buttonSoftText: "#a5f3fc", nav: "#0a3445" } },
  { id: "foret-enchantee", name: "Forêt Enchantée", premium: true, priceDiamonds: 160, dark: true, shopItemKey: "theme:foret-enchantee", vars: { bg: "#10281d", card: "#1a3c2c", cardAlt: "#142f22", text: "#f1f5f9", textMuted: "#bbf7d0", accent: "#34d399", border: "#2b5a44", button: "#16a34a", buttonText: "#ecfdf5", buttonSoft: "#214936", buttonSoftText: "#6ee7b7", nav: "#142f22" } },
  { id: "neon-cyberpunk", name: "Néon Cyberpunk", premium: true, priceDiamonds: 180, dark: true, shopItemKey: "theme:neon-cyberpunk", vars: { bg: "#08070f", card: "#17142a", cardAlt: "#100f1d", text: "#f8fafc", textMuted: "#d8b4fe", accent: "#f472b6", border: "#3b2f66", button: "#db2777", buttonText: "#fdf2f8", buttonSoft: "#271f49", buttonSoftText: "#c4b5fd", nav: "#100f1d" } },
  { id: "pastel-doux", name: "Pastel Doux", premium: true, priceDiamonds: 120, dark: false, shopItemKey: "theme:pastel-doux", vars: { bg: "#fff7fb", card: "#ffffff", cardAlt: "#fdf2f8", text: "#475569", textMuted: "#7c3f63", accent: "#a78bfa", border: "#f1d8e9", button: "#a78bfa", buttonText: "#ffffff", buttonSoft: "#fce7f3", buttonSoftText: "#7e22ce", nav: "#fff1f8" } },
  { id: "halloween-citrouille", name: "Citrouille (Saisonnier)", premium: true, seasonal: true, availabilityMonths: [10], priceDiamonds: 200, dark: true, shopItemKey: "theme:halloween-citrouille", vars: { bg: "#24140d", card: "#3a2217", cardAlt: "#2d1a12", text: "#fff7ed", textMuted: "#fdba74", accent: "#fb923c", border: "#7c2d12", button: "#ea580c", buttonText: "#fff7ed", buttonSoft: "#4a2a1c", buttonSoftText: "#fdba74", nav: "#2d1a12" } },
  { id: "noel-flocon", name: "Flocon (Saisonnier)", premium: true, seasonal: true, availabilityMonths: [12], priceDiamonds: 200, dark: false, shopItemKey: "theme:noel-flocon", vars: { bg: "#eef8ff", card: "#ffffff", cardAlt: "#f0f9ff", text: "#0f172a", textMuted: "#0369a1", accent: "#38bdf8", border: "#bae6fd", button: "#0ea5e9", buttonText: "#f0f9ff", buttonSoft: "#e0f2fe", buttonSoftText: "#0369a1", nav: "#f0f9ff" } },
];

export function getThemeById(id: string) {
  return quizzlyThemes.find((theme) => theme.id === id) ?? quizzlyThemes[0];
}

export function getActiveThemes(referenceDate = new Date()) {
  const month = referenceDate.getUTCMonth() + 1;
  return quizzlyThemes.filter((theme) => !theme.seasonal || !theme.availabilityMonths || theme.availabilityMonths.includes(month));
}

export function getDefaultUnlockedThemeIds(): QuizzlyThemeId[] {
  return ["classic-light", "classic-dark"];
}

export function getUnlockedThemeIdsFromInventory(itemKeys: string[]) {
  const unlocked = new Set<string>(getDefaultUnlockedThemeIds());
  const premiumThemes = quizzlyThemes.filter((theme) => theme.premium && !theme.seasonal);

  for (const itemKey of itemKeys) {
    if (itemKey.startsWith("theme:")) {
      const themeId = itemKey.replace("theme:", "");
      if (quizzlyThemes.some((theme) => theme.id === themeId)) unlocked.add(themeId);
    }
    if (itemKey.startsWith("theme:premium:")) {
      const tier = Number(itemKey.split(":").at(-1));
      if (!Number.isNaN(tier) && premiumThemes.length > 0) {
        const rewardTheme = premiumThemes[tier % premiumThemes.length];
        if (rewardTheme) unlocked.add(rewardTheme.id);
      }
    }
  }

  return Array.from(unlocked) as QuizzlyThemeId[];
}
