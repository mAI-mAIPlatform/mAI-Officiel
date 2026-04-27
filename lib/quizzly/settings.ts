export const QUIZZLY_SETTINGS_KEY = "mai.quizzly.settings.v1";

export type QuizzlySettings = {
  chapterDefault: string;
  classDefault: string;
  defaultModelId: string;
  notificationsEnabled: boolean;
  soundEffectsEnabled: boolean;
  subjectDefault: string;
  themePromptDefault: string;
};

export const defaultQuizzlySettings: QuizzlySettings = {
  chapterDefault: "",
  classDefault: "3ème",
  defaultModelId: "__random__",
  notificationsEnabled: true,
  soundEffectsEnabled: true,
  subjectDefault: "Mathématiques",
  themePromptDefault: "",
};

export function getQuizzlySettingsFromStorage(): QuizzlySettings {
  if (typeof window === "undefined") {
    return defaultQuizzlySettings;
  }

  try {
    const raw = window.localStorage.getItem(QUIZZLY_SETTINGS_KEY);
    if (!raw) {
      return defaultQuizzlySettings;
    }

    const parsed = JSON.parse(raw) as Partial<QuizzlySettings>;
    return {
      ...defaultQuizzlySettings,
      ...parsed,
    };
  } catch {
    return defaultQuizzlySettings;
  }
}

export function saveQuizzlySettingsToStorage(settings: QuizzlySettings) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(QUIZZLY_SETTINGS_KEY, JSON.stringify(settings));
}
