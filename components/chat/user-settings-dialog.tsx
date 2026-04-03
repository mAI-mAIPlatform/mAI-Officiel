"use client";

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
  avatarId: string;
  displayName: string;
};

const PROFILE_SETTINGS_STORAGE_KEY = "mai.profile.settings.v1";

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

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const nextProfileSettings: ProfileSettings = {
      avatarId,
      displayName: displayName.trim() || getDefaultDisplayName(user, isGuest),
    };

    window.localStorage.setItem(
      PROFILE_SETTINGS_STORAGE_KEY,
      JSON.stringify(nextProfileSettings)
    );
  }, [avatarId, displayName, isGuest, isHydrated, user]);

  const selectedAvatar = useMemo(
    () =>
      AVATAR_PRESETS.find((preset) => preset.id === avatarId) ??
      DEFAULT_AVATAR_PRESET,
    [avatarId]
  );

  return {
    avatarId,
    displayName,
    selectedAvatar,
    setAvatarId,
    setDisplayName,
  };
}

export function UserSettingsDialog({
  avatarId,
  displayName,
  isGuest,
  onAvatarIdChange,
  onDisplayNameChange,
  onOpenChange,
  open,
  user,
}: {
  avatarId: string;
  displayName: string;
  isGuest: boolean;
  onAvatarIdChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: User;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-lg border border-border/60 bg-card/80 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle>Paramètres du profil</DialogTitle>
          <DialogDescription>
            Personnalisez votre compte avec une identité visuelle claire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Section Compte: vraie configuration utilisateur demandée (nom + avatar). */}
          <section className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <h3 className="text-sm font-semibold">Compte</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Choisissez le nom affiché et l&apos;image de profil.
            </p>

            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium text-foreground/90"
                  htmlFor="profile-display-name"
                >
                  Nom de profil
                </label>
                <Input
                  id="profile-display-name"
                  maxLength={30}
                  onChange={(event) =>
                    onDisplayNameChange(event.target.value.slice(0, 30))
                  }
                  placeholder="Ex. Marie"
                  value={displayName}
                />
                <p className="text-[11px] text-muted-foreground">
                  Compte : {isGuest ? "Invité" : user.email}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground/90">
                  Image de profil
                </p>
                <div className="grid grid-cols-4 gap-2">
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
                        onClick={() => onAvatarIdChange(preset.id)}
                        type="button"
                      >
                        <span
                          className="size-8 rounded-full ring-1 ring-border/60"
                          style={{ background: preset.gradient }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-background/30 p-3 text-xs text-muted-foreground backdrop-blur-lg">
            <span className="font-semibold text-foreground/90">
              Personnalisation
            </span>{" "}
            · thème, densité visuelle et raccourcis (à venir).
          </section>
          <section className="rounded-2xl border border-border/60 bg-background/30 p-3 text-xs text-muted-foreground backdrop-blur-lg">
            <span className="font-semibold text-foreground/90">
              Fonctionnalités bêta
            </span>{" "}
            · accès anticipé et tests progressifs.
          </section>
          <section className="rounded-2xl border border-border/60 bg-background/30 p-3 text-xs text-muted-foreground backdrop-blur-lg">
            <span className="font-semibold text-foreground/90">Données</span> ·
            export, conservation et suppression complète.
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
