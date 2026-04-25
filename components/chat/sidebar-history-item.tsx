import { FlagIcon, FolderIcon, PinIcon } from "lucide-react";
import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import {
  CHAT_TAGS_STORAGE_KEY,
  readJsonStorage,
  TAG_DEFINITIONS_STORAGE_KEY,
  type TagDefinition,
} from "@/lib/chat-preferences";
import type { Chat, Project } from "@/lib/db/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LoaderIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "./icons";

const PureChatItem = ({
  chat,
  isActive,
  isGenerating,
  isPinned,
  onDelete,
  onPin,
  onRename,
  onReport,
  onAssignProject,
  onArchive,
  projects,
  setOpenMobile,
  isArchived,
}: {
  chat: Chat;
  isActive: boolean;
  isGenerating: boolean;
  isPinned: boolean;
  onDelete: (chatId: string) => void;
  onPin: (chatId: string) => void;
  onRename: (chatId: string, title: string) => void;
  onReport: (chatId: string) => void;
  onAssignProject: (chatId: string, projectId: string) => void;
  onArchive: (chatId: string, archived: boolean) => void;
  projects: Project[];
  setOpenMobile: (open: boolean) => void;
  isArchived: boolean;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const [chatTags, setChatTags] = useState<TagDefinition[]>([]);
  const [allTagDefinitions, setAllTagDefinitions] = useState<TagDefinition[]>(
    []
  );

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(chat.id);
  };

  const handleExportChat = async (format: "json" | "md" | "txt") => {
    const response = await fetch(`/api/messages?chatId=${chat.id}`);
    const payload = await response.json();
    const title = chat.title || "discussion";
    const messages = payload.messages ?? [];

    const normalized: Array<{ role: string; text: string }> = messages
      .map(
        (msg: {
          role: string;
          parts?: Array<{ type: string; text?: string }>;
        }) => {
          const text = (msg.parts ?? [])
            .filter(
              (part: { type: string; text?: string }) => part.type === "text"
            )
            .map((part: { type: string; text?: string }) => part.text ?? "")
            .join("\n")
            .trim();
          return { role: msg.role, text };
        }
      )
      .filter((item: { role: string; text: string }) => item.text.length > 0);

    const content =
      format === "json"
        ? JSON.stringify(
            { chat: { id: chat.id, title }, messages: normalized },
            null,
            2
          )
        : format === "md"
          ? `# ${title}\n\n${normalized.map((item: { role: string; text: string }) => `## ${item.role}\n\n${item.text}`).join("\n\n")}`
          : normalized
              .map(
                (item: { role: string; text: string }) =>
                  `[${item.role}]\n${item.text}`
              )
              .join("\n\n");

    const mime = format === "json" ? "application/json" : "text/plain";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.replace(/\s+/g, "-").toLowerCase() || "discussion"}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const assignTag = (tagId: string) => {
    const allTags = readJsonStorage<Record<string, string[]>>(
      CHAT_TAGS_STORAGE_KEY,
      {}
    );
    const current = allTags[chat.id] ?? [];
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId].slice(0, 3);
    allTags[chat.id] = next;
    window.localStorage.setItem(CHAT_TAGS_STORAGE_KEY, JSON.stringify(allTags));
    const definitions = readJsonStorage<TagDefinition[]>(
      TAG_DEFINITIONS_STORAGE_KEY,
      []
    );
    setChatTags(definitions.filter((tag) => next.includes(tag.id)));
  };

  useEffect(() => {
    const refreshTagDefinitions = () => {
      setAllTagDefinitions(
        readJsonStorage<TagDefinition[]>(TAG_DEFINITIONS_STORAGE_KEY, [])
      );
    };

    refreshTagDefinitions();
    window.addEventListener("storage", refreshTagDefinitions);
    window.addEventListener("mai:tags-updated", refreshTagDefinitions);

    return () => {
      window.removeEventListener("storage", refreshTagDefinitions);
      window.removeEventListener("mai:tags-updated", refreshTagDefinitions);
    };
  }, []);

  useEffect(() => {
    setRenameValue(chat.title);
  }, [chat.title]);

  useEffect(() => {
    const allTags = readJsonStorage<Record<string, string[]>>(
      CHAT_TAGS_STORAGE_KEY,
      {}
    );
    const ids = allTags[chat.id] ?? [];
    setChatTags(allTagDefinitions.filter((tag) => ids.includes(tag.id)));
  }, [allTagDefinitions, chat.id]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="h-8 rounded-none text-[13px] text-sidebar-foreground/50 transition-all duration-150 hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:font-normal data-active:text-sidebar-foreground/50 data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium"
        isActive={isActive}
      >
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate !text-black">{chat.title}</span>
            {isGenerating ? (
              <span
                className="liquid-panel inline-flex size-3 items-center justify-center rounded-full"
                title="Réponse en cours…"
              >
                <span className="animate-spin text-sidebar-foreground/80">
                  <LoaderIcon />
                </span>
              </span>
            ) : null}
          </span>
          {chatTags.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1">
              {chatTags.map((tag) => (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  key={tag.id}
                  style={{ backgroundColor: tag.color }}
                  title={tag.name}
                />
              ))}
            </span>
          )}
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="mr-0.5 rounded-md text-sidebar-foreground/50 ring-0 transition-colors duration-150 focus-visible:ring-0 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">Plus d&apos;options</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl"
          side="bottom"
        >
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => setRenameOpen(true)}
          >
            Renommer
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={handleCopyId}>
            Copier l'ID
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              Exporter
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleExportChat("md")}
                >
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleExportChat("json")}
                >
                  JSON (.json)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleExportChat("txt")}
                >
                  Texte (.txt)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              Tags
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl">
                {allTagDefinitions.length === 0 ? (
                  <DropdownMenuItem disabled>
                    Créez d'abord des tags
                  </DropdownMenuItem>
                ) : (
                  allTagDefinitions.map((tag) => (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      key={tag.id}
                      onClick={() => assignTag(tag.id)}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onPin(chat.id)}
          >
            <span className="inline-flex items-center gap-2">
              <span className="rounded-md border border-border/60 bg-background/70 p-1">
                <PinIcon className="size-3" />
              </span>
              {isPinned ? "Désépingler" : "Épingler"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onArchive(chat.id, !isArchived)}
          >
            {isArchived ? "Libérer de l'archive" : "Archiver"}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <FolderIcon className="size-3.5" />
              <span>Projet</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl">
                {projects.length === 0 ? (
                  <DropdownMenuItem disabled>Aucun projet</DropdownMenuItem>
                ) : (
                  projects.map((project) => (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      key={project.id}
                      onClick={() => onAssignProject(chat.id, project.id)}
                    >
                      {project.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onReport(chat.id)}
          >
            <span className="inline-flex items-center gap-2">
              <span className="rounded-md border border-border/60 bg-background/70 p-1 text-amber-600">
                <FlagIcon className="size-3" />
              </span>
              Signaler
            </span>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Partage</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl">
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => setVisibilityType("private")}
                >
                  <div className="flex flex-row items-center gap-2">
                    <LockIcon size={12} />
                    <span>Privé</span>
                  </div>
                  {visibilityType === "private" ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => setVisibilityType("public")}
                >
                  <div className="flex flex-row items-center gap-2">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === "public" ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            onSelect={() => onDelete(chat.id)}
            variant="destructive"
          >
            <TrashIcon />
            <span>Supprimer</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog onOpenChange={setRenameOpen} open={renameOpen}>
        <DialogContent className="liquid-panel border-white/25 bg-white/85 text-black backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Renommer la discussion</DialogTitle>
            <DialogDescription>
              Choisissez un titre court et clair.
            </DialogDescription>
          </DialogHeader>
          <input
            className="h-10 w-full rounded-xl border border-border/60 bg-background/80 px-3 text-sm outline-none"
            maxLength={80}
            onChange={(event) => setRenameValue(event.target.value)}
            value={renameValue}
          />
          <div className="mt-3 flex justify-end">
            <button
              className="rounded-xl border border-border/60 px-3 py-1.5 text-sm"
              onClick={() => {
                const next = renameValue.trim();
                if (!next) {
                  return;
                }
                onRename(chat.id, next);
                setRenameOpen(false);
              }}
              type="button"
            >
              Enregistrer
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) {
    return false;
  }
  if (prevProps.isGenerating !== nextProps.isGenerating) {
    return false;
  }
  if (prevProps.chat.title !== nextProps.chat.title) {
    return false;
  }
  if (prevProps.isPinned !== nextProps.isPinned) {
    return false;
  }
  if (prevProps.isArchived !== nextProps.isArchived) {
    return false;
  }
  return true;
});
