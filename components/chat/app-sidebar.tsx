"use client";

import {
  BookOpenIcon,
  BotIcon,
  BrainCircuitIcon,
  CreditCardIcon,
  FolderIcon,
  LanguagesIcon,
  LayoutGridIcon,
  PenSquareIcon,
  SearchIcon,
  Settings2Icon,
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
  { href: "/", label: "Discussion", icon: PenSquareIcon },
  { href: "/library", label: "Bibliothèque", icon: BookOpenIcon },
  { href: "/projects", label: "Projets", icon: FolderIcon },
  { href: "/settings", label: "Paramètres", icon: Settings2Icon },
  { href: "/pricing", label: "Tarifs", icon: CreditCardIcon },
] as const;

const APPLICATION_LINKS = [
  { href: "/mais", label: "mAIs", icon: BotIcon },
  { href: "/translation", label: "Traduction", icon: LanguagesIcon },
  { href: "/interpreter", label: "Code", icon: TerminalSquareIcon },
  { href: "/speaky", label: "Speaky", icon: Volume2Icon },
  { href: "/humanizy", label: "Humanizy", icon: BrainCircuitIcon },
] as const;

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const normalizedGlobalQuery = globalSearchQuery.trim().toLowerCase();

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

  const quickLinks = useMemo(() => {
    if (!normalizedGlobalQuery) {
      return [];
    }

    return QUICK_LINKS.filter((item) =>
      item.label.toLowerCase().includes(normalizedGlobalQuery)
    );
  }, [normalizedGlobalQuery]);

  const featuredLinks = useMemo(() => {
    const order = ["Projets", "Bibliothèque"] as const;
    return order
      .map((label) => QUICK_LINKS.find((item) => item.label === label))
      .filter((item) => item !== undefined);
  }, []);

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

      toast.success("Toutes les discussions ont été supprimées");
    } catch {
      toast.error("Échec de la suppression. Veuillez réessayer.");
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
                  className="group/logo relative h-8 w-8 shrink-0 justify-center rounded-lg border border-sidebar-border/60 bg-sidebar-accent/15 p-0 transition-colors hover:bg-sidebar-accent/35"
                  tooltip="mAI"
                >
                  <Link
                    className="relative flex size-full items-center justify-center"
                    href="/"
                    onClick={closeMobileSidebar}
                  >
                    <BrandStarLogoIcon size={16} />
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
                    placeholder="Recherche globale… (Ctrl/Cmd+K)"
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
                    tooltip="Nouvelle discussion"
                  >
                    <PenSquareIcon className="size-4" />
                    <span className="font-medium">Nouvelle discussion</span>
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
                        tooltip="Applications"
                      >
                        <LayoutGridIcon className="size-3.5" />
                        <span className="font-medium">Applications</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-56"
                      side="right"
                      sideOffset={6}
                    >
                      {APPLICATION_LINKS.map((item) => (
                        <DropdownMenuItem asChild key={`app-${item.href}`}>
                          <Link
                            href={item.href}
                            onClick={closeMobileSidebar}
                          >
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
                        <span>Aller vers {item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {normalizedGlobalQuery.length > 0 &&
                  quickLinks.length === 0 && (
                    <SidebarMenuItem>
                      <div className="px-2 py-1 text-[11px] text-sidebar-foreground/60">
                        Aucun module trouvé.
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
                      <span className="text-[13px]">Tout supprimer</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarHistory globalSearchQuery={globalSearchQuery} user={user} />
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
            <AlertDialogTitle>
              Supprimer toutes les discussions ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes vos discussions seront
              supprimées définitivement de nos serveurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
