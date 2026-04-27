"use client";

import { useEffect, useState } from "react";

type Settings = {
  deadlineReminders: boolean;
  taskAssignment: boolean;
  commentAdded: boolean;
  taskCompleted: boolean;
};

const defaultSettings: Settings = {
  deadlineReminders: true,
  taskAssignment: true,
  commentAdded: true,
  taskCompleted: true,
};

export function ProjectNotificationSettings({ projectId }: { projectId: string }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/notification-settings`)
      .then((response) => response.json())
      .then((data: Settings) => setSettings(data));
  }, [projectId]);

  const update = async (key: keyof Settings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);

    await fetch(`/api/projects/${projectId}/notification-settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  };

  const items: Array<{ key: keyof Settings; label: string }> = [
    { key: "deadlineReminders", label: "Rappels de deadline" },
    { key: "taskAssignment", label: "Assignation de tâche" },
    { key: "commentAdded", label: "Commentaire ajouté" },
    { key: "taskCompleted", label: "Complétion de tâche" },
  ];

  return (
    <section className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
      <h2 className="text-base font-semibold">Paramètres de notification</h2>
      <p className="mt-1 text-sm text-black/65">
        Activez ou désactivez les notifications par type pour ce projet.
      </p>

      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <label className="flex items-center justify-between rounded-xl border border-black/10 bg-white/75 p-3" key={item.key}>
            <span className="text-sm">{item.label}</span>
            <button
              className={`h-6 w-11 rounded-full border transition ${settings[item.key] ? "border-cyan-400 bg-cyan-300" : "border-black/20 bg-white"}`}
              onClick={() => update(item.key, !settings[item.key])}
              type="button"
            >
              <span
                className={`block size-4 rounded-full bg-white shadow transition ${settings[item.key] ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </label>
        ))}
      </div>
    </section>
  );
}
