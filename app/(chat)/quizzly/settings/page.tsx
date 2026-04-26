"use client";

import { useEffect, useState } from "react";
import {
  defaultQuizzlySettings,
  getQuizzlySettingsFromStorage,
  saveQuizzlySettingsToStorage,
  type QuizzlySettings,
} from "@/lib/quizzly/settings";
import { toast } from "sonner";

const modelSuggestions = ["__random__", "gpt-5.4", "gpt-5.4-mini", "horde/Cydonia-24B-v4.3"];

export default function QuizzlySettingsPage() {
  const [settings, setSettings] = useState<QuizzlySettings>(defaultQuizzlySettings);

  useEffect(() => {
    setSettings(getQuizzlySettingsFromStorage());
  }, []);

  const handleSave = () => {
    saveQuizzlySettingsToStorage(settings);
    toast.success("Paramètres Quizzly sauvegardés");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-slate-800">Paramètres Quizzly</h1>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
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
          <input className="w-full border rounded-xl px-3 py-2" value={settings.classDefault} onChange={(e) => setSettings({ ...settings, classDefault: e.target.value })} />
        </div>

        <div>
          <p className="font-semibold text-slate-700 mb-2">Matière par défaut</p>
          <input className="w-full border rounded-xl px-3 py-2" value={settings.subjectDefault} onChange={(e) => setSettings({ ...settings, subjectDefault: e.target.value })} />
        </div>

        <div>
          <p className="font-semibold text-slate-700 mb-2">Chapitre par défaut</p>
          <input className="w-full border rounded-xl px-3 py-2" value={settings.chapterDefault} onChange={(e) => setSettings({ ...settings, chapterDefault: e.target.value })} />
        </div>

        <div>
          <p className="font-semibold text-slate-700 mb-2">Modèle par défaut</p>
          <input list="quizzly-models" className="w-full border rounded-xl px-3 py-2" value={settings.defaultModelId} onChange={(e) => setSettings({ ...settings, defaultModelId: e.target.value })} />
          <datalist id="quizzly-models">
            {modelSuggestions.map((model) => <option key={model} value={model} />)}
          </datalist>
        </div>

        <div>
          <p className="font-semibold text-slate-700 mb-2">Prompt thème par défaut</p>
          <textarea className="w-full border rounded-xl px-3 py-2" rows={3} value={settings.themePromptDefault} onChange={(e) => setSettings({ ...settings, themePromptDefault: e.target.value })} />
        </div>

        <button onClick={handleSave} className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold">Sauvegarder</button>
      </div>
    </div>
  );
}
