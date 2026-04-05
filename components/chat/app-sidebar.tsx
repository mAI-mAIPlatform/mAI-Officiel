"use client";

import {
  BotIcon,
  Code2,
  FolderKanbanIcon,
  HeartPulse,
  Languages,
  Newspaper,
  PenSquareIcon,
  Sparkles,
  TrashIcon,
  WalletCards,
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
  SidebarTrigger,
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

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(false);
    router.replace("/");
    mutate(unstable_serialize(getChatHistoryPaginationKey), [], {
      revalidate: false,
    });

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
      method: "DELETE",
    });

    toast.success("Toutes les discussions ont été supprimées");
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-0 pt-3">
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-row items-center justify-between">
              <SidebarMenuButton
                asChild
                className="size-8 !px-0 items-center justify-center"
                tooltip="MAI"
              >
                <Link href="/" onClick={() => setOpenMobile(false)}>
                  <BrandStarLogoIcon size={20} />
                </Link>
              </SidebarMenuButton>
              <div className="group-data-[collapsible=icon]:hidden">
                <SidebarTrigger className="text-sidebar-foreground/60 transition-colors duration-150 hover:text-sidebar-foreground" />
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
                  {
                    href: "/coder",
                    icon: Code2,
                    label: "Coder",
                    restricted: true,
                  },
                  {
                    href: "/news",
                    icon: Newspaper,
                    label: "Actualités",
                    restricted: true,
                  },
                  {
                    href: "/translation",
                    icon: Languages,
                    label: "Traduction",
                  },
                  {
                    href: "/health",
                    icon: HeartPulse,
                    label: "mAIHealth",
                  },
                  {
                    href: "/studio",
                    icon: Sparkles,
                    label: "Studio",
                  },
                  {
                    href: "/pricing",
                    icon: WalletCards,
                    label: "Forfaits",
                  },
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
                        {item.restricted ? (
                          <span className="rounded-full bg-red-500/90 px-1.5 py-0.5 text-[9px] text-white">
                            Accès restreint
                          </span>
                        ) : null}
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
          <SidebarHistory user={user} />
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
