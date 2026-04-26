"use client";

import { useEffect, useState } from "react";
import {
  defaultQuizzlySettings,
  getQuizzlySettingsFromStorage,
  saveQuizzlySettingsToStorage,
  type QuizzlySettings,
} from "@/lib/quizzly/settings";
import { buyItem, getQuizzlyInventory, getQuizzlyProfile } from "@/lib/quizzly/actions";
import {
  QUIZZLY_THEME_EVENT,
  QUIZZLY_THEME_KEY,
  QUIZZLY_UNLOCKED_THEMES_KEY,
  getActiveThemes,
  getDefaultUnlockedThemeIds,
  getUnlockedThemeIdsFromInventory,
  type QuizzlyThemeId,
} from "@/lib/quizzly/themes";
import { chatModels } from "@/lib/ai/models";
import { toast } from "sonner";
import { quizzlyOnboardingRestartEvent } from "@/components/quizzly/onboarding-tour";

const classOptions = ["CE1", "CE2", "CM1", "CM2", "6ème", "5ème", "4ème", "3ème", "Seconde", "Première", "Terminale"];
const subjectOptions = ["Mathématiques", "Français", "Histoire", "Géographie", "Sciences", "Anglais", "Culture Générale", "Technologie"];
const modelSuggestions = [
  { id: "__random__", name: "Aléatoire" },
  ...chatModels.map((model) => ({ id: model.id, name: model.name })),
].slice(0, 40);

export default function QuizzlySettingsPage() {
  const [settings, setSettings] = useState<QuizzlySettings>(defaultQuizzlySettings);
  const [currentTheme, setCurrentTheme] = useState<QuizzlyThemeId>("classic-light");
  const [unlockedThemes, setUnlockedThemes] = useState<QuizzlyThemeId[]>(getDefaultUnlockedThemeIds());
  const [diamonds, setDiamonds] = useState(0);
  const [themeLoading, setThemeLoading] = useState(false);

  useEffect(() => {
    setSettings(getQuizzlySettingsFromStorage());
    const savedTheme = (localStorage.getItem(QUIZZLY_THEME_KEY) as QuizzlyThemeId | null) ?? "classic-light";
    setCurrentTheme(savedTheme);
    Promise.all([getQuizzlyProfile(), getQuizzlyInventory()]).then(([profile, inventory]) => {
      setDiamonds(profile.diamonds);
      const fromInventory = getUnlockedThemeIdsFromInventory(inventory.filter((item) => item.quantity > 0).map((item) => item.itemKey));
      const localParsed = (() => {
        try {
          return JSON.parse(localStorage.getItem(QUIZZLY_UNLOCKED_THEMES_KEY) ?? "[]") as QuizzlyThemeId[];
        } catch {
          return [];
        }
      })();
      const merged = Array.from(new Set([...fromInventory, ...localParsed]));
      setUnlockedThemes(merged as QuizzlyThemeId[]);
      localStorage.setItem(QUIZZLY_UNLOCKED_THEMES_KEY, JSON.stringify(merged));
    });
  }, []);

  const handleSave = () => {
    saveQuizzlySettingsToStorage(settings);
    toast.success("Paramètres Quizzly sauvegardés");
  };

  const applyTheme = (themeId: QuizzlyThemeId) => {
    localStorage.setItem(QUIZZLY_THEME_KEY, themeId);
    setCurrentTheme(themeId);
    window.dispatchEvent(new Event(QUIZZLY_THEME_EVENT));
  };

  const buyTheme = async (themeId: QuizzlyThemeId, price: number) => {
    setThemeLoading(true);
    if (diamonds < price) {
      toast.error("Diamants insuffisants.");
      setThemeLoading(false);
      return;
    }
    await buyItem(`theme:${themeId}`, price, 1);
    setDiamonds((prev) => Math.max(0, prev - price));
    const next = Array.from(new Set([...unlockedThemes, themeId])) as QuizzlyThemeId[];
    setUnlockedThemes(next as QuizzlyThemeId[]);
    localStorage.setItem(QUIZZLY_UNLOCKED_THEMES_KEY, JSON.stringify(next));
    toast.success("Thème débloqué !");
    setThemeLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-slate-800">Paramètres Quizzly</h1>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <p className="font-black text-slate-800">Apparence</p>
          <label className="flex items-center justify-between gap-3">
            <span className="font-semibold text-slate-700">Mode sombre / clair</span>
            <input type="checkbox" checked={currentTheme !== "classic-light"} onChange={(e) => applyTheme(e.target.checked ? "classic-dark" : "classic-light")} />
          </label>
          <p className="text-xs text-slate-500">Transition animée fluide (300ms).</p>
        </div>
        <label className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">Notifications Quizzly</span>
          <input type="checkbox" checked={settings.notificationsEnabled} onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })} />
        </label>

        <label className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">Effets sonores</span>
          <input type="checkbox" checked={settings.soundEffectsEnabled} onChange={(e) => setSettings({ ...settings, soundEffectsEnabled: e.target.checked })} />
        </label>

        <div>
          <p className="font-semibold text-slate-700 mb-2">Classe par défaut</p>
          <select className="w-full border rounded-xl px-3 py-2" value={settings.classDefault} onChange={(e) => setSettings({ ...settings, classDefault: e.target.value })}>
            {classOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div>
          <p className="font-semibold text-slate-700 mb-2">Matière par défaut</p>
          <select className="w-full border rounded-xl px-3 py-2" value={settings.subjectDefault} onChange={(e) => setSettings({ ...settings, subjectDefault: e.target.value })}>
            {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div>
          <p className="font-semibold text-slate-700 mb-2">Chapitre par défaut</p>
          <input className="w-full border rounded-xl px-3 py-2" value={settings.chapterDefault} onChange={(e) => setSettings({ ...settings, chapterDefault: e.target.value })} />
        </div>

        <div>
          <p className="font-semibold text-slate-700 mb-2">Modèle par défaut</p>
          <select className="w-full border rounded-xl px-3 py-2" value={settings.defaultModelId} onChange={(e) => setSettings({ ...settings, defaultModelId: e.target.value })}>
            {modelSuggestions.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
          </select>
        </div>

        <div>
          <p className="font-semibold text-slate-700 mb-2">Prompt thème par défaut</p>
          <textarea className="w-full border rounded-xl px-3 py-2" rows={3} value={settings.themePromptDefault} onChange={(e) => setSettings({ ...settings, themePromptDefault: e.target.value })} />
        </div>

        <button onClick={handleSave} className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold">Sauvegarder</button>
        <button
          className="ml-2 rounded-xl bg-slate-100 px-5 py-2.5 font-bold text-slate-700"
          onClick={() => {
            window.dispatchEvent(new Event(quizzlyOnboardingRestartEvent));
            toast.success("Tutoriel relancé.");
          }}
          type="button"
        >
          Revoir le tutoriel
        </button>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <p className="font-black text-slate-800">Thèmes</p>
        <p className="text-xs text-slate-500">Sous-section « Thèmes » — Diamants disponibles: {diamonds}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {getActiveThemes().map((theme) => {
            const unlocked = unlockedThemes.includes(theme.id) || !theme.premium;
            return (
              <div key={theme.id} className="rounded-xl border border-slate-100 p-3">
                <div className="mb-2 h-16 rounded-lg" style={{ background: `linear-gradient(120deg, ${theme.vars.bg}, ${theme.vars.card})` }} />
                <p className="font-bold text-slate-800">{theme.name}</p>
                <p className="text-xs text-slate-500">{theme.premium ? `${theme.priceDiamonds ?? 0}💎${theme.seasonal ? " • saisonnier" : ""}` : "Gratuit"}</p>
                {unlocked ? (
                  <button className={`mt-2 rounded-lg px-3 py-1 text-xs font-bold ${currentTheme === theme.id ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`} onClick={() => applyTheme(theme.id)} type="button">
                    {currentTheme === theme.id ? "Actif" : "Appliquer"}
                  </button>
                ) : (
                  <button className="mt-2 rounded-lg bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 disabled:opacity-50" disabled={themeLoading} onClick={() => buyTheme(theme.id, theme.priceDiamonds ?? 0)} type="button">
                    Acheter
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
