import Link from "next/link";
import { memo, useEffect, useMemo, useState } from "react";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Chat } from "@/lib/db/schema";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "./icons";

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  onPin,
  onRename,
  onReport,
  setOpenMobile,
  tags,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  onPin: (chatId: string) => void;
  onRename: (chatId: string, title: string) => void;
  onReport: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  tags: Array<{ color: string; id: string; name: string }>;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const [availableTags, setAvailableTags] = useState<
    Array<{ color: string; id: string; name: string }>
  >([]);
  const [chatTags, setChatTags] = useState(tags);

  useEffect(() => {
    setChatTags(tags);
  }, [tags]);

  useEffect(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((payload) => setAvailableTags(payload.tags ?? []))
      .catch(() => setAvailableTags([]));
  }, []);

  const selectedTagIds = useMemo(
    () => new Set(chatTags.map((tag) => tag.id)),
    [chatTags]
  );

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(chat.id);
  };

  const handleExportChat = async () => {
    const response = await fetch(`/api/messages?chatId=${chat.id}`);
    const payload = await response.json();
    const content = JSON.stringify(
      { chat: { id: chat.id, title: chat.title }, messages: payload.messages },
      null,
      2
    );
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${chat.title.replace(/\s+/g, "-").toLowerCase() || "discussion"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const toggleTag = async (tagId: string, checked: boolean) => {
    const response = await fetch("/api/chat-tags", {
      body: JSON.stringify({ chatId: chat.id, tagId }),
      headers: { "Content-Type": "application/json" },
      method: checked ? "POST" : "DELETE",
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setChatTags(payload.tags ?? []);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="h-11 rounded-none text-[13px] text-sidebar-foreground/50 transition-all duration-150 hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:font-normal data-active:text-sidebar-foreground/50 data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium data-[active=true]:border-b data-[active=true]:border-dashed data-[active=true]:border-sidebar-foreground/50"
        isActive={isActive}
      >
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <div className="flex min-w-0 flex-col">
            <span className="truncate">{chat.title}</span>
            {chatTags.length > 0 && (
              <span className="mt-0.5 flex items-center gap-1 overflow-hidden">
                {chatTags.slice(0, 3).map((tag) => (
                  <span
                    className="rounded-full border border-sidebar-border/50 px-1.5 py-0 text-[10px]"
                    key={tag.id}
                    style={{
                      backgroundColor: `${tag.color}22`,
                      color: tag.color,
                    }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </span>
            )}
          </div>
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
            onSelect={() => {
              setIsRenaming(true);
              setRenameValue(chat.title);
            }}
          >
            Renommer
          </DropdownMenuItem>
          {isRenaming && (
            <div className="px-2 pb-2">
              <input
                className="h-8 w-full rounded-md border border-border/50 bg-background/80 px-2 text-xs"
                onChange={(event) => setRenameValue(event.target.value)}
                value={renameValue}
              />
              <button
                className="mt-1 w-full rounded-md bg-primary/10 py-1 text-xs text-primary"
                onClick={() => {
                  onRename(chat.id, renameValue.trim());
                  setIsRenaming(false);
                }}
                type="button"
              >
                Enregistrer le titre complet
              </button>
            </div>
          )}
          <DropdownMenuItem className="cursor-pointer" onSelect={handleCopyId}>
            Copier l'ID
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={handleExportChat}
          >
            Exporter
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onPin(chat.id)}
          >
            Épingler
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onReport(chat.id)}
          >
            Signaler
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

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <span>Tags</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl">
                {availableTags.length === 0 ? (
                  <DropdownMenuItem disabled>
                    Aucun tag disponible
                  </DropdownMenuItem>
                ) : (
                  availableTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      checked={selectedTagIds.has(tag.id)}
                      key={tag.id}
                      onCheckedChange={(checked) =>
                        toggleTag(tag.id, Boolean(checked))
                      }
                    >
                      <span style={{ color: tag.color }}>#{tag.name}</span>
                    </DropdownMenuCheckboxItem>
                  ))
                )}
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
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) {
    return false;
  }
  return true;
});
