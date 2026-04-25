"use client";

import {
  BadgeCheck,
  Bot,
  Brain,
  FlaskConical,
  Languages,
  Palette,
  Shield,
  UserCircle2,
  Volume2,
} from "lucide-react";
import type { User } from "next-auth";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  defaultShortcuts,
  SHORTCUTS_STORAGE_KEY,
  type ShortcutConfig,
  TAG_DEFINITIONS_STORAGE_KEY,
  TAG_PALETTE,
  type TagDefinition,
} from "@/lib/chat-preferences";
import { setClientPreferenceCookie } from "@/lib/client-preferences";
import { getGuestDisplayName } from "@/lib/guest-display";
import { type AppLanguage, LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ProfileSettings = {
  aiMemory: string;
  aiName: string;
  avatarDataUrl?: string;
  avatarId: string;
  displayName: string;
  personalContext: string;
  profession: string;
  projectDescription: string;
  projectIconColor: string;
  projectTitle: string;
  stylisticDirectives: string;
};

const PROFILE_SETTINGS_STORAGE_KEY = "mai.profile.settings.v2";

type VoiceSettings = {
  captionsEnabled: boolean;
  interfaceMode: "liquid" | "minimal";
  pitch: number;
  rate: number;
  voiceURI: string;
};

const VOICE_SETTINGS_STORAGE_KEY = "mai.voice.settings.v1";

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  captionsEnabled: true,
  interfaceMode: "liquid",
  pitch: 1,
  rate: 1,
  voiceURI: "",
};

const AVATAR_PRESETS = [
  {
    id: "aurora",
    label: "Aurore",
    gradient:
      "linear-gradient(135deg, oklch(0.72 0.19 248), oklch(0.66 0.15 168))",
  },
  {
    id: "sunset",
    label: "Coucher",
    gradient:
      "linear-gradient(135deg, oklch(0.72 0.2 25), oklch(0.72 0.19 338))",
  },
  {
    id: "ocean",
    label: "Océan",
    gradient:
      "linear-gradient(135deg, oklch(0.62 0.14 222), oklch(0.66 0.13 190))",
  },
  {
    id: "forest",
    label: "Forêt",
    gradient:
      "linear-gradient(135deg, oklch(0.56 0.11 154), oklch(0.68 0.13 110))",
  },
] as const;

export const DEFAULT_AVATAR_PRESET = AVATAR_PRESETS[0];

function parseProfileSettings(
  rawSettings: string
): Partial<ProfileSettings> | null {
  try {
    return JSON.parse(rawSettings) as Partial<ProfileSettings>;
  } catch {
    return null;
  }
}

function getDefaultDisplayName(user: User, isGuest: boolean): string {
  if (isGuest) {
    return getGuestDisplayName(user.email) ?? "Visiteur";
  }

  const userNameFromEmail = user.email?.split("@")[0]?.trim();
  return userNameFromEmail?.length ? userNameFromEmail : "Utilisateur";
}

export function useProfileSettings({
  isGuest,
  user,
}: {
  isGuest: boolean;
  user: User;
}) {
  // État local complet de personnalisation, persisté côté navigateur.
  const [displayName, setDisplayName] = useState(() =>
    getDefaultDisplayName(user, isGuest)
  );
  const [avatarId, setAvatarId] = useState<string>(DEFAULT_AVATAR_PRESET.id);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>();
  const [aiName, setAiName] = useState("mAI");
  const [profession, setProfession] = useState("");
  const [personalContext, setPersonalContext] = useState("");
  const [aiMemory, setAiMemory] = useState("");
  const [_projectTitle, setProjectTitle] = useState("");
  const [_projectDescription, setProjectDescription] = useState("");
  const [_projectIconColor, setProjectIconColor] = useState("#60a5fa");
  const [stylisticDirectives, setStylisticDirectives] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Hydratation initiale: on restaure les préférences utilisateur enregistrées.
    const savedProfileSettings = window.localStorage.getItem(
      PROFILE_SETTINGS_STORAGE_KEY
    );

    if (!savedProfileSettings) {
      setIsHydrated(true);
      return;
    }

    const parsedProfileSettings = parseProfileSettings(savedProfileSettings);

    if (!parsedProfileSettings) {
      window.localStorage.removeItem(PROFILE_SETTINGS_STORAGE_KEY);
      setIsHydrated(true);
      return;
    }

    if (
      parsedProfileSettings.displayName &&
      parsedProfileSettings.displayName.trim().length > 0
    ) {
      setDisplayName(parsedProfileSettings.displayName);
    }

    if (
      parsedProfileSettings.avatarId &&
      AVATAR_PRESETS.some(
        (preset) => preset.id === parsedProfileSettings.avatarId
      )
    ) {
      setAvatarId(parsedProfileSettings.avatarId);
    }

    setAvatarDataUrl(parsedProfileSettings.avatarDataUrl);
    setAiName(parsedProfileSettings.aiName ?? "mAI");
    setProfession(parsedProfileSettings.profession ?? "");
    setPersonalContext(parsedProfileSettings.personalContext ?? "");
    setAiMemory(parsedProfileSettings.aiMemory ?? "");
    setProjectTitle(parsedProfileSettings.projectTitle ?? "");
    setProjectDescription(parsedProfileSettings.projectDescription ?? "");
    setProjectIconColor(parsedProfileSettings.projectIconColor ?? "#60a5fa");
    setStylisticDirectives(parsedProfileSettings.stylisticDirectives ?? "");

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    // Persistance continue pour conserver l'environnement collaboratif et IA.
    const nextProfileSettings: ProfileSettings = {
      aiMemory,
      aiName: aiName.trim() || "mAI",
      avatarDataUrl,
      avatarId,
      displayName: displayName.trim() || getDefaultDisplayName(user, isGuest),
      personalContext,
      profession,
      projectDescription: _projectDescription,
      projectIconColor: _projectIconColor,
      projectTitle: _projectTitle,
      stylisticDirectives,
    };

    const serializedSettings = JSON.stringify(nextProfileSettings);

    window.localStorage.setItem(
      PROFILE_SETTINGS_STORAGE_KEY,
      serializedSettings
    );
    setClientPreferenceCookie("mai_profile", serializedSettings);
  }, [
    aiMemory,
    aiName,
    avatarDataUrl,
    avatarId,
    displayName,
    isGuest,
    isHydrated,
    personalContext,
    profession,
    _projectDescription,
    _projectIconColor,
    _projectTitle,
    stylisticDirectives,
    user,
  ]);

  const selectedAvatar = useMemo(
    () =>
      AVATAR_PRESETS.find((preset) => preset.id === avatarId) ??
      DEFAULT_AVATAR_PRESET,
    [avatarId]
  );

  const currentAvatarBackground = avatarDataUrl
    ? `url(${avatarDataUrl})`
    : selectedAvatar.gradient;

  return {
    aiMemory,
    aiName,
    avatarDataUrl,
    avatarId,
    currentAvatarBackground,
    displayName,
    personalContext,
    profession,
    selectedAvatar,
    setAiMemory,
    setAiName,
    setAvatarDataUrl,
    setAvatarId,
    setDisplayName,
    setPersonalContext,
    setProfession,
    setProjectDescription,
    setProjectIconColor,
    setProjectTitle,
    setStylisticDirectives,
    stylisticDirectives,
  };
}

export function UserSettingsDialog({
  aiMemory,
  aiName,
  avatarDataUrl,
  avatarId,
  displayName,
  isGuest,
  onAiMemoryChange,
  onAiNameChange,
  onAvatarDataUrlChange,
  onAvatarIdChange,
  onDisplayNameChange,
  onOpenChange,
  onPersonalContextChange,
  onProfessionChange,
  onProjectDescriptionChange,
  onProjectIconColorChange,
  onProjectTitleChange,
  onStylisticDirectivesChange,
  open,
  personalContext,
  profession,
  stylisticDirectives,
  user,
}: {
  aiMemory: string;
  aiName: string;
  avatarDataUrl?: string;
  avatarId: string;
  displayName: string;
  isGuest: boolean;
  onAiMemoryChange: (value: string) => void;
  onAiNameChange: (value: string) => void;
  onAvatarDataUrlChange: (value?: string) => void;
  onAvatarIdChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onPersonalContextChange: (value: string) => void;
  onProfessionChange: (value: string) => void;
  onProjectDescriptionChange: (value: string) => void;
  onProjectIconColorChange: (value: string) => void;
  onProjectTitleChange: (value: string) => void;
  onStylisticDirectivesChange: (value: string) => void;
  open: boolean;
  personalContext: string;
  profession: string;
  stylisticDirectives: string;
  user: User;
}) {
  const [tagDefinitions, setTagDefinitions] = useLocalStorage<TagDefinition[]>(
    TAG_DEFINITIONS_STORAGE_KEY,
    []
  );
  const [nextTagName, setNextTagName] = useState("");
  const [nextTagColor, setNextTagColor] = useState<string>(TAG_PALETTE[0]);
  const [shortcuts, setShortcuts] = useLocalStorage<ShortcutConfig>(
    SHORTCUTS_STORAGE_KEY,
    defaultShortcuts
  );
  const [language, setLanguage] = useLocalStorage<AppLanguage>(
    LANGUAGE_STORAGE_KEY,
    "fr"
  );
  const [voiceSettings, setVoiceSettings] = useLocalStorage<VoiceSettings>(
    VOICE_SETTINGS_STORAGE_KEY,
    DEFAULT_VOICE_SETTINGS
  );
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("mai:language-updated", {
        detail: { language },
      })
    );
    setClientPreferenceCookie("mai_language", language);
  }, [language]);

  const handleResetLocalData = () => {
    window.localStorage.removeItem(PROFILE_SETTINGS_STORAGE_KEY);
    onDisplayNameChange(getDefaultDisplayName(user, isGuest));
    onAvatarIdChange(DEFAULT_AVATAR_PRESET.id);
    onAvatarDataUrlChange(undefined);
    onAiNameChange("mAI");
    onProfessionChange("");
    onPersonalContextChange("");
    onAiMemoryChange("");
    onProjectTitleChange("");
    onProjectDescriptionChange("");
    onProjectIconColorChange("#60a5fa");
    onStylisticDirectivesChange("");
  };

  const registerShortcut = (
    action: keyof ShortcutConfig,
    keyboardEvent: KeyboardEvent<HTMLInputElement>
  ) => {
    keyboardEvent.preventDefault();
    const parts = [
      keyboardEvent.ctrlKey ? "ctrl" : null,
      keyboardEvent.altKey ? "alt" : null,
      keyboardEvent.shiftKey ? "shift" : null,
      keyboardEvent.key.toLowerCase(),
    ].filter(Boolean);

    const combo = parts.join("+");
    const hasConflict = Object.entries(shortcuts).some(
      ([currentAction, value]) => currentAction !== action && value === combo
    );

    if (hasConflict) {
      return;
    }

    setShortcuts((current) => ({ ...current, [action]: combo }));
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden border border-border/60 bg-card/70 p-0 backdrop-blur-3xl">
        <DialogHeader className="border-b border-border/50 bg-background/40 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <BadgeCheck className="size-4 text-blue-500" />
            Paramètres complets
          </DialogTitle>
          <DialogDescription>
            Profil, personnalisation IA, projets, ingestion et style de réponse.
          </DialogDescription>
        </DialogHeader>

        <div className="grid h-[calc(90vh-80px)] grid-cols-[220px_1fr]">
          <aside className="space-y-2 border-r border-border/40 bg-background/30 p-4 text-xs text-muted-foreground">
            <div className="rounded-xl border border-border/50 bg-background/60 p-3 text-foreground">
              <p className="font-semibold">Sections</p>
            </div>
            <p className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <UserCircle2 className="size-3.5" /> Profil
            </p>
            <p className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <Bot className="size-3.5" /> Agent IA
            </p>
            <p className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <Brain className="size-3.5" /> Ingestion de données
            </p>
            <p className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <Palette className="size-3.5" /> Style & directives
            </p>
            <p className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <Volume2 className="size-3.5" /> Voix
            </p>
            <p className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <Languages className="size-3.5" /> Langue
            </p>
            <p className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <Shield className="size-3.5" /> Données
            </p>
          </aside>

          <div className="space-y-4 overflow-y-auto p-5">
            <section className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <h3 className="text-sm font-semibold">Profil</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  maxLength={30}
                  onChange={(event) =>
                    onDisplayNameChange(event.target.value.slice(0, 30))
                  }
                  placeholder="Nom affiché"
                  value={displayName}
                />
                <Input
                  onChange={(event) => onProfessionChange(event.target.value)}
                  placeholder="Profession"
                  value={profession}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Compte : {isGuest ? "Invité" : user.email}
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = preset.id === avatarId;

                  return (
                    <button
                      aria-label={`Avatar ${preset.label}`}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border border-transparent bg-background/50 p-2 transition-all",
                        "hover:border-border/60 hover:bg-background/80",
                        isSelected &&
                          "border-primary/40 bg-primary/10 ring-1 ring-primary/30"
                      )}
                      key={preset.id}
                      onClick={() => {
                        onAvatarDataUrlChange(undefined);
                        onAvatarIdChange(preset.id);
                      }}
                      type="button"
                    >
                      <span
                        className="size-8 rounded-full bg-cover bg-center ring-1 ring-border/60"
                        style={{ background: preset.gradient }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Input
                accept="image/*"
                className="mt-3"
                onChange={(event) => {
                  // Upload d'avatar custom: conversion en DataURL (stockage local).
                  const file = event.target.files?.[0];

                  if (!file) {
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = () => {
                    onAvatarDataUrlChange(
                      typeof reader.result === "string"
                        ? reader.result
                        : undefined
                    );
                  };
                  reader.readAsDataURL(file);
                }}
                type="file"
              />
              {avatarDataUrl ? (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Image personnalisée active.
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <h3 className="text-sm font-semibold">
                Configuration de l&apos;agent
              </h3>
              <div className="mt-3 space-y-2">
                <Input
                  onChange={(event) => onAiNameChange(event.target.value)}
                  placeholder="Nom de l'IA"
                  value={aiName}
                />
                <textarea
                  className="min-h-20 w-full rounded-xl border border-border/60 bg-background/70 p-2 text-sm"
                  onChange={(event) =>
                    onPersonalContextChange(event.target.value)
                  }
                  placeholder="Informations personnelles utiles à l'IA"
                  value={personalContext}
                />
                <textarea
                  className="min-h-20 w-full rounded-xl border border-border/60 bg-background/70 p-2 text-sm"
                  onChange={(event) => onAiMemoryChange(event.target.value)}
                  placeholder="Mémoire persistante (préférences, objectifs, contexte)"
                  value={aiMemory}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <h3 className="text-sm font-semibold">
                Ingestion de données & directives stylistiques
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Ajoutez vos sources documentaires dans les projets, puis
                définissez un style de réponse global.
              </p>
              <textarea
                className="mt-3 min-h-20 w-full rounded-xl border border-border/60 bg-background/70 p-2 text-sm"
                onChange={(event) =>
                  onStylisticDirectivesChange(event.target.value)
                }
                placeholder="Ex: Style professionnel, concis, orienté plan d'action"
                value={stylisticDirectives}
              />
            </section>

            <section className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <h3 className="text-sm font-semibold">Tags de conversations</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Maximum 20 tags, 20 caractères par nom, et 3 tags par
                conversation.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tagDefinitions.map((tag) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-xs"
                    key={tag.id}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                <Input
                  maxLength={20}
                  onChange={(event) => setNextTagName(event.target.value)}
                  placeholder="Nouveau tag"
                  value={nextTagName}
                />
                <button
                  className="rounded-xl border border-border/60 px-3 text-xs"
                  onClick={() => {
                    if (!nextTagName.trim() || tagDefinitions.length >= 20) {
                      return;
                    }
                    setTagDefinitions((current) => [
                      ...current,
                      {
                        id: crypto.randomUUID(),
                        name: nextTagName.trim().slice(0, 20),
                        color: nextTagColor,
                      },
                    ]);
                    setNextTagName("");
                  }}
                  type="button"
                >
                  Ajouter
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAG_PALETTE.map((color) => (
                  <button
                    className={cn(
                      "h-5 w-5 rounded-full ring-1 ring-border/50",
                      nextTagColor === color && "ring-2 ring-foreground"
                    )}
                    key={color}
                    onClick={() => setNextTagColor(color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-cyan-400" />
                <h3 className="text-sm font-semibold">Voix</h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                  <FlaskConical className="size-3" /> Expérimental
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                mAI Voice utilise la Web Speech API du navigateur (dictée +
                synthèse vocale).
              </p>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-xs">
                  <span className="mb-1 block text-muted-foreground">
                    Voix de synthèse
                  </span>
                  <select
                    className="h-9 w-full rounded-xl border border-border/60 bg-background/70 px-2 text-xs"
                    onChange={(event) =>
                      setVoiceSettings((current) => ({
                        ...current,
                        voiceURI: event.target.value,
                      }))
                    }
                    value={voiceSettings.voiceURI}
                  >
                    <option value="">Voix système (auto)</option>
                    {availableVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} — {voice.lang}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs">
                  <span className="mb-1 block text-muted-foreground">
                    Style d'interface
                  </span>
                  <select
                    className="h-9 w-full rounded-xl border border-border/60 bg-background/70 px-2 text-xs"
                    onChange={(event) =>
                      setVoiceSettings((current) => ({
                        ...current,
                        interfaceMode:
                          event.target.value === "minimal"
                            ? "minimal"
                            : "liquid",
                      }))
                    }
                    value={voiceSettings.interfaceMode}
                  >
                    <option value="liquid">Liquid Glass</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-xs">
                  <span className="mb-1 block text-muted-foreground">
                    Vitesse ({voiceSettings.rate.toFixed(1)}x)
                  </span>
                  <input
                    className="w-full accent-cyan-500"
                    max={2}
                    min={0.6}
                    onChange={(event) =>
                      setVoiceSettings((current) => ({
                        ...current,
                        rate: Number(event.target.value),
                      }))
                    }
                    step={0.1}
                    type="range"
                    value={voiceSettings.rate}
                  />
                </label>

                <label className="text-xs">
                  <span className="mb-1 block text-muted-foreground">
                    Hauteur ({voiceSettings.pitch.toFixed(1)})
                  </span>
                  <input
                    className="w-full accent-cyan-500"
                    max={2}
                    min={0.5}
                    onChange={(event) =>
                      setVoiceSettings((current) => ({
                        ...current,
                        pitch: Number(event.target.value),
                      }))
                    }
                    step={0.1}
                    type="range"
                    value={voiceSettings.pitch}
                  />
                </label>
              </div>

              <label className="mt-3 flex items-center gap-2 text-xs">
                <input
                  checked={voiceSettings.captionsEnabled}
                  onChange={(event) =>
                    setVoiceSettings((current) => ({
                      ...current,
                      captionsEnabled: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                Activer les sous-titres dans mAI Voice
              </label>

              <button
                className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-border/60 bg-background/70 px-3 text-xs"
                onClick={async () => {
                  if (!("Notification" in window)) {
                    return;
                  }

                  await Notification.requestPermission();
                }}
                type="button"
              >
                Autoriser les notifications PWA (iPhone/Android)
              </button>
            </section>

            <section className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Languages className="size-4 text-violet-400" /> Langue de
                l'interface
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Le changement s'applique immédiatement aux zones déjà
                internationalisées.
              </p>
              <select
                className="mt-3 h-9 w-full rounded-xl border border-border/60 bg-background/70 px-2 text-xs md:w-72"
                onChange={(event) =>
                  setLanguage((event.target.value as AppLanguage) || "fr")
                }
                value={language}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="zh">中文（普通话）</option>
              </select>
            </section>

            <section className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <h3 className="text-sm font-semibold">Raccourcis clavier</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Cliquez dans un champ puis tapez votre combinaison. Les conflits
                sont bloqués.
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {[
                  { key: "newChat", label: "Nouveau chat" },
                  { key: "likeMessage", label: "Like message" },
                  { key: "dislikeMessage", label: "Dislike message" },
                  { key: "copyMessage", label: "Copier message" },
                ].map((item) => (
                  <label className="text-xs" key={item.key}>
                    <span className="mb-1 block text-muted-foreground">
                      {item.label}
                    </span>
                    <Input
                      onKeyDown={(event) =>
                        registerShortcut(
                          item.key as keyof ShortcutConfig,
                          event
                        )
                      }
                      readOnly
                      value={shortcuts[item.key as keyof ShortcutConfig]}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-background/35 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <h3 className="text-sm font-semibold">Sécurité et données</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Vos paramètres sont stockés localement dans le navigateur
                (localStorage). Aucun avatar personnalisé n&apos;est envoyé par
                défaut à un service externe.
              </p>
              <div className="mt-3 rounded-xl border border-border/50 bg-background/60 p-3 text-xs text-muted-foreground">
                <p>
                  • Clé locale :{" "}
                  <code className="font-mono text-[11px] text-foreground">
                    {PROFILE_SETTINGS_STORAGE_KEY}
                  </code>
                </p>
                <p className="mt-1">
                  • Avatar : preset local ou image convertie en DataURL.
                </p>
                <p className="mt-1">
                  • Réinitialisation : supprime les préférences locales et
                  restaure les valeurs par défaut.
                </p>
              </div>
              <button
                className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-red-500/35 bg-red-500/10 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-300"
                onClick={handleResetLocalData}
                type="button"
              >
                Réinitialiser mes données locales
              </button>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
