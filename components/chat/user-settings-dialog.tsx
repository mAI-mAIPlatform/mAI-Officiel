"use client";

import {
  BadgeCheck,
  Bot,
  Brain,
  FolderKanban,
  Palette,
  Shield,
  UserCircle2,
} from "lucide-react";
import type { User } from "next-auth";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
    return "Invité";
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
  const [displayName, setDisplayName] = useState(() =>
    getDefaultDisplayName(user, isGuest)
  );
  const [avatarId, setAvatarId] = useState<string>(DEFAULT_AVATAR_PRESET.id);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>();
  const [aiName, setAiName] = useState("mAI");
  const [profession, setProfession] = useState("");
  const [personalContext, setPersonalContext] = useState("");
  const [aiMemory, setAiMemory] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectIconColor, setProjectIconColor] = useState("#60a5fa");
  const [stylisticDirectives, setStylisticDirectives] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
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

    const nextProfileSettings: ProfileSettings = {
      aiMemory,
      aiName: aiName.trim() || "mAI",
      avatarDataUrl,
      avatarId,
      displayName: displayName.trim() || getDefaultDisplayName(user, isGuest),
      personalContext,
      profession,
      projectDescription,
      projectIconColor,
      projectTitle,
      stylisticDirectives,
    };

    window.localStorage.setItem(
      PROFILE_SETTINGS_STORAGE_KEY,
      JSON.stringify(nextProfileSettings)
    );
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
    projectDescription,
    projectIconColor,
    projectTitle,
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
    projectDescription,
    projectIconColor,
    projectTitle,
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
  projectDescription,
  projectIconColor,
  projectTitle,
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
  projectDescription: string;
  projectIconColor: string;
  projectTitle: string;
  stylisticDirectives: string;
  user: User;
}) {
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
              <FolderKanban className="size-3.5" /> Projets
            </p>
            <p className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <Brain className="size-3.5" /> Ingestion de données
            </p>
            <p className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <Palette className="size-3.5" /> Style & directives
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
              <h3 className="text-sm font-semibold">Projets & identité</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <Input
                  onChange={(event) => onProjectTitleChange(event.target.value)}
                  placeholder="Titre du projet"
                  value={projectTitle}
                />
                <Input
                  onChange={(event) =>
                    onProjectIconColorChange(event.target.value)
                  }
                  placeholder="Couleur d'icône (hex)"
                  value={projectIconColor}
                />
                <textarea
                  className="md:col-span-2 min-h-20 w-full rounded-xl border border-border/60 bg-background/70 p-2 text-sm"
                  onChange={(event) =>
                    onProjectDescriptionChange(event.target.value)
                  }
                  placeholder="Description du projet (facultatif)"
                  value={projectDescription}
                />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="size-3 rounded-full"
                  style={{ background: projectIconColor }}
                />
                Aperçu de couleur d&apos;identité projet
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
