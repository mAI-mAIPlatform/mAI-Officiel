"use client";

import { ChevronUp } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { setClientPreferenceCookie } from "@/lib/client-preferences";
import { getGuestDisplayName } from "@/lib/guest-display";
import { LoaderIcon } from "./icons";
import { toast } from "./toast";

const PROFILE_SETTINGS_STORAGE_KEY = "mai.profile.settings.v2";

const avatarGradientsById: Record<string, string> = {
  aurora: "linear-gradient(135deg, oklch(0.72 0.19 248), oklch(0.66 0.15 168))",
  sunset: "linear-gradient(135deg, oklch(0.72 0.2 25), oklch(0.72 0.19 338))",
  ocean: "linear-gradient(135deg, oklch(0.62 0.14 222), oklch(0.66 0.13 190))",
  forest: "linear-gradient(135deg, oklch(0.56 0.11 154), oklch(0.68 0.13 110))",
};

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const [customDisplayName, setCustomDisplayName] = useState<string | null>(
    null
  );
  const [customAvatarDataUrl, setCustomAvatarDataUrl] = useState<string | null>(
    null
  );
  const [customAvatarId, setCustomAvatarId] = useState<string>("aurora");

  useEffect(() => {
    const syncProfile = () => {
      const raw = window.localStorage.getItem(PROFILE_SETTINGS_STORAGE_KEY);
      if (!raw) {
        setCustomDisplayName(null);
        setCustomAvatarDataUrl(null);
        setCustomAvatarId("aurora");
        return;
      }

      try {
        const parsed = JSON.parse(raw) as {
          displayName?: string;
          avatarDataUrl?: string;
          avatarId?: string;
        };
        setCustomDisplayName(parsed.displayName?.trim() || null);
        setCustomAvatarDataUrl(parsed.avatarDataUrl || null);
        setCustomAvatarId(parsed.avatarId || "aurora");
      } catch {
        setCustomDisplayName(null);
        setCustomAvatarDataUrl(null);
        setCustomAvatarId("aurora");
      }
    };

    syncProfile();
    window.addEventListener("storage", syncProfile);
    window.addEventListener("focus", syncProfile);
    window.document.addEventListener("visibilitychange", syncProfile);
    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("focus", syncProfile);
      window.document.removeEventListener("visibilitychange", syncProfile);
    };
  }, [pathname]);

  const guestDisplayName = getGuestDisplayName(data?.user?.email ?? user.email);
  const isGuest = Boolean(guestDisplayName);
  const displayName =
    customDisplayName ||
    guestDisplayName ||
    data?.user?.name?.trim() ||
    user.name?.trim() ||
    user.email?.split("@")[0] ||
    "Utilisateur";
  const avatarBackground = useMemo(() => {
    if (customAvatarDataUrl) {
      return `url(${customAvatarDataUrl})`;
    }

    return avatarGradientsById[customAvatarId] ?? avatarGradientsById.aurora;
  }, [customAvatarDataUrl, customAvatarId]);
  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {status === "loading" ? (
              <SidebarMenuButton className="h-10 justify-between rounded-lg bg-transparent text-sidebar-foreground/50 transition-colors duration-150 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex flex-row items-center gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-sidebar-foreground/10" />
                  <span className="animate-pulse rounded-md bg-sidebar-foreground/10 text-[13px] text-transparent">
                    Chargement...
                  </span>
                </div>
                <div className="animate-spin text-sidebar-foreground/50">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="h-8 rounded-lg bg-transparent px-2 text-sidebar-foreground/70 transition-colors duration-150 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
              >
                <div
                  className="size-5 shrink-0 rounded-full bg-sidebar-accent bg-cover bg-center ring-1 ring-sidebar-border/50"
                  style={{ backgroundImage: avatarBackground }}
                />
                <span className="truncate text-[13px]" data-testid="user-email">
                  {displayName}
                </span>
                <ChevronUp className="ml-auto size-3.5 text-sidebar-foreground/50" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width) rounded-lg border border-border/60 bg-card/95 shadow-[var(--shadow-float)] backdrop-blur-xl"
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer text-[13px]"
              data-testid="user-nav-item-theme"
              onSelect={() => {
                const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
                setTheme(nextTheme);
                setClientPreferenceCookie("mai_theme", nextTheme);
              }}
            >
              {resolvedTheme === "light" ? "Thème Sombre" : "Thème Clair"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-[13px]"
              onSelect={() => {
                closeMobileSidebar();
                router.push("/settings");
              }}
            >
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-[13px]"
              onSelect={() => {
                closeMobileSidebar();
                router.push("/stats");
              }}
            >
              Statistiques
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-[13px]"
              onSelect={() => {
                closeMobileSidebar();
                router.push("/archives");
              }}
            >
              Archives
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <button
                className="w-full cursor-pointer rounded-md bg-blue-600 text-[13px] font-medium text-white hover:bg-blue-500"
                onClick={() => {
                  closeMobileSidebar();
                  router.push("/pricing");
                }}
                type="button"
              >
                Mettre à niveau
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                className="w-full cursor-pointer text-[13px]"
                download
                href="/api/export"
                onClick={closeMobileSidebar}
              >
                Exporter mes données
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                className="w-full cursor-pointer text-[13px]"
                onClick={() => {
                  if (status === "loading") {
                    toast({
                      type: "error",
                      description:
                        "Vérification de session en cours, réessayez dans un instant.",
                    });
                    return;
                  }

                  if (isGuest) {
                    closeMobileSidebar();
                    router.push("/login");
                  } else {
                    closeMobileSidebar();
                    signOut({ redirectTo: "/" });
                  }
                }}
                type="button"
              >
                {isGuest ? "Se connecter" : "Se déconnecter"}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
