"use client";

import {
  BotIcon,
  FolderKanbanIcon,
  PenSquareIcon,
  PuzzleIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
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

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const normalizedGlobalQuery = globalSearchQuery.trim().toLowerCase();

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
                  className="size-8 !px-0 items-center justify-center"
                  tooltip="MAI"
                >
                  <Link href="/" onClick={() => setOpenMobile(false)}>
                    <BrandStarLogoIcon size={20} />
                  </Link>
                </SidebarMenuButton>
                <label
                  className="flex h-8 flex-1 items-center gap-1.5 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/35 px-2 backdrop-blur-xl group-data-[collapsible=icon]:hidden"
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
                    placeholder="Recherche globale..."
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
                      setOpenMobile(false);
                      router.push("/");
                    }}
                    tooltip="Nouvelle discussion"
                  >
                    <PenSquareIcon className="size-4" />
                    <span className="font-medium">Nouvelle discussion</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {[
                  {
                    href: "/projects",
                    icon: FolderKanbanIcon,
                    label: "Projets",
                  },
                  { href: "/mais", icon: BotIcon, label: "Mes mAIs" },
                ].map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className="h-8 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/45 hover:text-sidebar-foreground"
                      tooltip={item.label}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon className="size-4" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-8 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/45 hover:text-sidebar-foreground"
                    tooltip="Extensions"
                  >
                    <Link href="/extensions" onClick={() => setOpenMobile(false)}>
                      <PuzzleIcon className="size-4" />
                      <span className="font-medium">Extensions</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {normalizedGlobalQuery.length > 0 &&
                  [
                    { href: "/projects", label: "Projets" },
                    { href: "/mais", label: "Mes mAIs" },
                    { href: "/extensions", label: "Extensions" },
                  ]
                    .filter((item) =>
                      item.label.toLowerCase().includes(normalizedGlobalQuery)
                    )
                    .map((item) => (
                      <SidebarMenuItem key={`quick-${item.href}`}>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg border border-dashed border-sidebar-border/70 text-[12px] text-sidebar-foreground/75"
                          tooltip={item.label}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setOpenMobile(false)}
                          >
                            <SearchIcon className="size-3.5" />
                            <span>Aller vers {item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}

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
