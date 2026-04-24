"use client";

import {
  BookOpenIcon,
  BotIcon,
  CreditCardIcon,
  FingerprintIcon,
  FolderIcon,
  ImagePlusIcon,
  LanguagesIcon,
  PanelsTopLeftIcon,
  PenSquareIcon,
  SearchIcon,
  Settings2Icon,
  AudioWaveformIcon,
  TerminalSquareIcon,
  TrashIcon,
  Volume2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/hooks/use-language";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { BrandStarLogoIcon } from "./icons";

const QUICK_LINKS = [
  { href: "/", key: "discussion", icon: PenSquareIcon },
  { href: "/library", key: "library", icon: BookOpenIcon },
  { href: "/projects", key: "projects", icon: FolderIcon },
  { href: "/settings", key: "settings", icon: Settings2Icon },
  { href: "/pricing", key: "pricing", icon: CreditCardIcon },
] as const;

const APPLICATION_LINKS = [
  { href: "/studio", key: "studio", icon: ImagePlusIcon },
  { href: "/wave", key: "wave", icon: AudioWaveformIcon },
  { href: "/mais", key: "mais", icon: BotIcon },
  { href: "/translation", key: "translation", icon: LanguagesIcon },
  { href: "/interpreter", key: "code", icon: TerminalSquareIcon },
  { href: "/speaky", key: "speaky", icon: Volume2Icon },
  { href: "/humanizy", key: "humanizy", icon: FingerprintIcon },
] as const;

const sidebarI18n = {
  en: {
    apps: "Apps",
    discussion: "Chat",
    deleteAll: "Delete all",
    deleteAllConfirm: "Delete all conversations?",
    deleteAllDesc:
      "This action is irreversible. All your conversations will be permanently deleted from our servers.",
    deleteFail: "Deletion failed. Please try again.",
    deleteSuccess: "All conversations have been deleted",
    historyLoading: "Loading history…",
    modulesNotFound: "No module found.",
    newChat: "New chat",
    library: "Library",
    pricing: "Pricing",
    studio: "Studio",
    wave: "Wave",
    projects: "Projects",
    settings: "Settings",
    translation: "Translation",
    code: "Code",
    mais: "mAIs",
    speaky: "Speaky",
    humanizy: "Humanizy",
    quickGoTo: "Go to",
    searchPlaceholder: "Global search… (Ctrl/Cmd+K)",
    cancel: "Cancel",
    delete: "Delete",
  },
  es: {
    apps: "Aplicaciones",
    discussion: "Discusión",
    deleteAll: "Borrar todo",
    deleteAllConfirm: "¿Borrar todas las conversaciones?",
    deleteAllDesc:
      "Esta acción es irreversible. Todas tus conversaciones se eliminarán definitivamente de nuestros servidores.",
    deleteFail: "Error al eliminar. Inténtalo de nuevo.",
    deleteSuccess: "Todas las conversaciones han sido eliminadas",
    historyLoading: "Cargando historial…",
    modulesNotFound: "No se encontró ningún módulo.",
    newChat: "Nueva conversación",
    library: "Biblioteca",
    pricing: "Precios",
    studio: "Estudio",
    wave: "Wave",
    projects: "Proyectos",
    settings: "Ajustes",
    translation: "Traducción",
    code: "Código",
    mais: "mAIs",
    speaky: "Speaky",
    humanizy: "Humanizy",
    quickGoTo: "Ir a",
    searchPlaceholder: "Búsqueda global… (Ctrl/Cmd+K)",
    cancel: "Cancelar",
    delete: "Eliminar",
  },
  de: {
    apps: "Apps",
    discussion: "Chat",
    deleteAll: "Alles löschen",
    deleteAllConfirm: "Alle Unterhaltungen löschen?",
    deleteAllDesc:
      "Diese Aktion ist irreversibel. Alle Unterhaltungen werden dauerhaft von unseren Servern gelöscht.",
    deleteFail: "Löschen fehlgeschlagen. Bitte erneut versuchen.",
    deleteSuccess: "Alle Unterhaltungen wurden gelöscht",
    historyLoading: "Verlauf wird geladen…",
    modulesNotFound: "Kein Modul gefunden.",
    newChat: "Neuer Chat",
    library: "Bibliothek",
    pricing: "Preise",
    studio: "Studio",
    wave: "Wave",
    projects: "Projekte",
    settings: "Einstellungen",
    translation: "Übersetzung",
    code: "Code",
    mais: "mAIs",
    speaky: "Speaky",
    humanizy: "Humanizy",
    quickGoTo: "Gehe zu",
    searchPlaceholder: "Globale Suche… (Ctrl/Cmd+K)",
    cancel: "Abbrechen",
    delete: "Löschen",
  },
  it: {
    apps: "App",
    discussion: "Chat",
    deleteAll: "Elimina tutto",
    deleteAllConfirm: "Eliminare tutte le conversazioni?",
    deleteAllDesc:
      "Questa azione è irreversibile. Tutte le conversazioni verranno eliminate definitivamente dai nostri server.",
    deleteFail: "Eliminazione non riuscita. Riprova.",
    deleteSuccess: "Tutte le conversazioni sono state eliminate",
    historyLoading: "Caricamento cronologia…",
    modulesNotFound: "Nessun modulo trovato.",
    newChat: "Nuova chat",
    library: "Libreria",
    pricing: "Prezzi",
    studio: "Studio",
    wave: "Wave",
    projects: "Progetti",
    settings: "Impostazioni",
    translation: "Traduzione",
    code: "Codice",
    mais: "mAIs",
    speaky: "Speaky",
    humanizy: "Humanizy",
    quickGoTo: "Vai a",
    searchPlaceholder: "Ricerca globale… (Ctrl/Cmd+K)",
    cancel: "Annulla",
    delete: "Elimina",
  },
  fr: {
    apps: "Applications",
    discussion: "Discussion",
    deleteAll: "Tout supprimer",
    deleteAllConfirm: "Supprimer toutes les discussions ?",
    deleteAllDesc:
      "Cette action est irréversible. Toutes vos discussions seront supprimées définitivement de nos serveurs.",
    deleteFail: "Échec de la suppression. Veuillez réessayer.",
    deleteSuccess: "Toutes les discussions ont été supprimées",
    historyLoading: "Chargement de l'historique…",
    modulesNotFound: "Aucun module trouvé.",
    newChat: "Nouvelle discussion",
    library: "Bibliothèque",
    pricing: "Tarifs",
    studio: "Studio",
    wave: "Wave",
    projects: "Projets",
    settings: "Paramètres",
    translation: "Traduction",
    code: "Code",
    mais: "mAIs",
    speaky: "Speaky",
    humanizy: "Humanizy",
    quickGoTo: "Aller vers",
    searchPlaceholder: "Recherche globale… (Ctrl/Cmd+K)",
    cancel: "Annuler",
    delete: "Supprimer",
  },
} as const;

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const { language } = useLanguage();
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [isHistoryReady, setIsHistoryReady] = useState(false);
  const normalizedGlobalQuery = globalSearchQuery.trim().toLowerCase();
  const sidebarText = sidebarI18n[language];
  const quickLinksResolved = QUICK_LINKS.map((item) => ({
    ...item,
    label: sidebarText[item.key],
  }));
  const applicationLinksResolved = APPLICATION_LINKS.map((item) => ({
    ...item,
    label: sidebarText[item.key],
  }));

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("global-sidebar-search")?.focus();
      }
    };

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    const browserWindow = window as Window & {
      cancelIdleCallback?: (handle: number) => void;
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions
      ) => number;
    };
    const idleCallback = browserWindow.requestIdleCallback?.(
      () => setIsHistoryReady(true),
      { timeout: 800 }
    );
    const timeoutId = window.setTimeout(() => setIsHistoryReady(true), 350);

    return () => {
      if (idleCallback !== undefined) {
        browserWindow.cancelIdleCallback?.(idleCallback);
      }
      window.clearTimeout(timeoutId);
    };
  }, []);

  const quickLinks = useMemo(() => {
    if (!normalizedGlobalQuery) {
      return [];
    }

    return quickLinksResolved.filter((item) =>
      item.label.toLowerCase().includes(normalizedGlobalQuery)
    );
  }, [normalizedGlobalQuery, quickLinksResolved]);

  const featuredLinks = useMemo(() => {
    const order = [sidebarText.projects, sidebarText.library] as const;
    return order
      .map((label) => quickLinksResolved.find((item) => item.label === label))
      .filter((item) => item !== undefined);
  }, [quickLinksResolved, sidebarText.library, sidebarText.projects]);

  const handleDeleteAll = async () => {
    setShowDeleteAllDialog(false);
    router.replace("/");
    mutate(unstable_serialize(getChatHistoryPaginationKey), [], {
      revalidate: false,
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Suppression globale impossible");
      }

      toast.success(sidebarText.deleteSuccess);
    } catch {
      toast.error(sidebarText.deleteFail);
    }
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-0 pt-3">
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-row items-center justify-between">
              <div className="flex w-full items-center gap-2 px-1">
                <SidebarMenuButton
                  asChild
                  className="group/logo relative h-10 w-10 shrink-0 justify-center rounded-lg border border-sidebar-border/60 bg-sidebar-accent/15 p-0 transition-colors hover:bg-sidebar-accent/35"
                  tooltip="mAI"
                >
                  <Link
                    className="relative flex size-full items-center justify-center"
                    href="/"
                    onClick={closeMobileSidebar}
                  >
                    <BrandStarLogoIcon size={22} />
                    <span className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 rounded-md border border-sidebar-border/70 bg-sidebar/90 p-0.5 opacity-0 transition-opacity duration-150 group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100">
                      <PenSquareIcon className="size-3 text-sidebar-foreground/80" />
                    </span>
                  </Link>
                </SidebarMenuButton>
                <label
                  className="liquid-panel flex h-9 flex-1 items-center gap-1.5 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/35 px-2.5 backdrop-blur-xl group-data-[collapsible=icon]:hidden"
                  htmlFor="global-sidebar-search"
                >
                  <SearchIcon className="size-3.5 text-sidebar-foreground/60" />
                  <input
                    autoComplete="off"
                    className="w-full bg-transparent text-[12px] text-sidebar-foreground placeholder:text-sidebar-foreground/55 focus:outline-none"
                    id="global-sidebar-search"
                    onChange={(event) =>
                      setGlobalSearchQuery(event.target.value)
                    }
                    placeholder={sidebarText.searchPlaceholder}
                    type="search"
                    value={globalSearchQuery}
                  />
                </label>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="pt-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-8 rounded-lg border border-sidebar-border text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    onClick={() => {
                      closeMobileSidebar();
                      router.push("/");
                    }}
                    tooltip={sidebarText.newChat}
                  >
                    <PenSquareIcon className="size-4" />
                    <span className="font-medium">{sidebarText.newChat}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {featuredLinks.map((item) => (
                  <SidebarMenuItem key={`featured-${item.label}`}>
                    <SidebarMenuButton
                      asChild
                      className="h-8 rounded-lg border border-sidebar-border/70 text-[13px] text-sidebar-foreground/85 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      tooltip={item.label}
                    >
                      <Link href={item.href} onClick={closeMobileSidebar}>
                        <item.icon className="size-3.5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        className="h-8 rounded-lg border border-sidebar-border/70 text-[13px] text-sidebar-foreground/85 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        tooltip={sidebarText.apps}
                      >
                        <PanelsTopLeftIcon className="size-4" />
                        <span className="font-medium">{sidebarText.apps}</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-56"
                      side={isMobile ? "bottom" : "right"}
                      sideOffset={isMobile ? 10 : 6}
                    >
                      {applicationLinksResolved.map((item) => (
                        <DropdownMenuItem asChild key={`app-${item.href}`}>
                          <Link href={item.href} onClick={closeMobileSidebar}>
                            <item.icon className="mr-2 size-3.5" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>

                {quickLinks.map((item) => (
                  <SidebarMenuItem key={`quick-${item.href}`}>
                    <SidebarMenuButton
                      asChild
                      className="h-8 rounded-lg border border-dashed border-sidebar-border/70 text-[12px] text-sidebar-foreground/75"
                      tooltip={item.label}
                    >
                      <Link href={item.href} onClick={closeMobileSidebar}>
                        <item.icon className="size-3.5" />
                        <span>
                          {sidebarText.quickGoTo} {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {normalizedGlobalQuery.length > 0 &&
                  quickLinks.length === 0 && (
                    <SidebarMenuItem>
                      <div className="px-2 py-1 text-[11px] text-sidebar-foreground/60">
                        {sidebarText.modulesNotFound}
                      </div>
                    </SidebarMenuItem>
                  )}

                {user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="rounded-lg text-sidebar-foreground/40 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setShowDeleteAllDialog(true)}
                      tooltip="Supprimer toutes les discussions"
                    >
                      <TrashIcon className="size-4" />
                      <span className="text-[13px]">
                        {sidebarText.deleteAll}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {isHistoryReady ? (
            <SidebarHistory globalSearchQuery={globalSearchQuery} user={user} />
          ) : (
            <div className="px-2 py-3 text-xs text-sidebar-foreground/55">
              {sidebarText.historyLoading}
            </div>
          )}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border pt-2 pb-3">
          {user && <SidebarUserNav user={user} />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sidebarText.deleteAllConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {sidebarText.deleteAllDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{sidebarText.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              {sidebarText.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
