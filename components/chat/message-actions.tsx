import equal from "fast-deep-equal";
import { Flag, Pause, Pin, Play, Square } from "lucide-react";
import { memo } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import type { Vote } from "@/lib/db/schema";
import { triggerHaptic } from "@/lib/haptics";
import type { ChatMessage } from "@/lib/types";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { CopyIcon, PencilEditIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

const parseLocalStorageArray = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getSafetyCategory = (value: string) => {
  const normalized = value.toLowerCase();
  return /(violence|abus|agression|harc[eè]lement|suicide)/i.test(normalized)
    ? "violence_abus"
    : "autre";
};

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  onEdit,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  onEdit?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) {
    return null;
  }

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    triggerHaptic(16);
    toast.success("Copied to clipboard!");
  };

  const handlePinMessage = () => {
    const pinnedMessages = parseLocalStorageArray("mai.pinned.messages");
    if (!pinnedMessages.includes(message.id)) {
      pinnedMessages.unshift(message.id);
      localStorage.setItem(
        "mai.pinned.messages",
        JSON.stringify(pinnedMessages)
      );
    }
    triggerHaptic(12);
    toast.success("Message épinglé");
  };

  const speakText = () => {
    if (!textFromParts || typeof window === "undefined") {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textFromParts);
    utterance.onend = () => {
      window.dispatchEvent(new CustomEvent("mai:speech-ended"));
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleReportMessage = () => {
    const reports = parseLocalStorageArray("mai.reports.messages");
    const category = getSafetyCategory(textFromParts ?? "");

    reports.unshift({
      messageId: message.id,
      chatId,
      questionnaire: {
        gravite: category === "violence_abus" ? "élevée" : "moyenne",
        categorie: category,
      },
      preview: textFromParts?.slice(0, 240) ?? "",
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("mai.reports.messages", JSON.stringify(reports));
    toast.success(
      category === "violence_abus"
        ? "Message signalé (priorité sécurité)"
        : "Message signalé"
    );
  };

  if (message.role === "user") {
    return (
      <Actions className="-mr-0.5 justify-end opacity-0 transition-opacity duration-150 group-hover/message:opacity-100">
        <div className="flex items-center gap-0.5">
          {onEdit && (
            <Action
              className="size-7 text-muted-foreground/50 hover:text-foreground"
              data-testid="message-edit-button"
              onClick={onEdit}
              tooltip="Edit"
            >
              <PencilEditIcon />
            </Action>
          )}
          <Action
            className="size-7 text-muted-foreground/50 hover:text-foreground"
            onClick={handleCopy}
            tooltip="Copy"
          >
            <CopyIcon />
          </Action>
          <Action
            className="size-7 text-muted-foreground/50 hover:text-foreground"
            onClick={handlePinMessage}
            tooltip="Épingler"
          >
            <Pin className="size-3.5" />
          </Action>
          <Action
            className="size-7 text-muted-foreground/50 hover:text-foreground"
            onClick={handleReportMessage}
            tooltip="Signaler"
          >
            <Flag className="size-3.5" />
          </Action>
        </div>
      </Actions>
    );
  }

  return (
    <Actions className="-ml-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex h-7 items-center justify-center rounded-md px-1.5 text-xs text-muted-foreground/70 hover:text-foreground"
            type="button"
          >
            Réécrire
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {[
            { mode: "same", label: "Réécrire (identique)" },
            { mode: "shorter", label: "Plus concis" },
            { mode: "longer", label: "Plus détaillé" },
          ].map((item) => (
            <DropdownMenuItem
              key={item.mode}
              onClick={() => {
                triggerHaptic(10);
                window.dispatchEvent(
                  new CustomEvent("mai:rewrite-message", {
                    detail: {
                      chatId,
                      mode: item.mode,
                      text: textFromParts ?? "",
                    },
                  })
                );
              }}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handlePinMessage}
        tooltip="Épingler"
      >
        <Pin className="size-3.5" />
      </Action>
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handleReportMessage}
        tooltip="Signaler"
      >
        <Flag className="size-3.5" />
      </Action>
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={speakText}
        tooltip="Écouter"
      >
        <Play className="size-3.5" />
      </Action>
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={() => window.speechSynthesis.pause()}
        tooltip="Pause"
      >
        <Pause className="size-3.5" />
      </Action>
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={() => window.speechSynthesis.cancel()}
        tooltip="Stop"
      >
        <Square className="size-3.5" />
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        data-testid="message-upvote"
        disabled={vote?.isUpvoted}
        onClick={() => {
          const upvote = fetch(
            `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote`,
            {
              method: "PATCH",
              body: JSON.stringify({
                chatId,
                messageId: message.id,
                type: "up",
              }),
            }
          );

          toast.promise(upvote, {
            loading: "Upvoting Response...",
            success: () => {
              mutate<Vote[]>(
                `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`,
                (currentVotes) => {
                  if (!currentVotes) {
                    return [];
                  }

                  const votesWithoutCurrent = currentVotes.filter(
                    (currentVote) => currentVote.messageId !== message.id
                  );

                  return [
                    ...votesWithoutCurrent,
                    {
                      chatId,
                      messageId: message.id,
                      isUpvoted: true,
                    },
                  ];
                },
                { revalidate: false }
              );

              return "Upvoted Response!";
            },
            error: "Failed to upvote response.",
          });
        }}
        tooltip="Upvote Response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        data-testid="message-downvote"
        disabled={vote && !vote.isUpvoted}
        onClick={() => {
          const downvote = fetch(
            `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote`,
            {
              method: "PATCH",
              body: JSON.stringify({
                chatId,
                messageId: message.id,
                type: "down",
              }),
            }
          );

          toast.promise(downvote, {
            loading: "Downvoting Response...",
            success: () => {
              mutate<Vote[]>(
                `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`,
                (currentVotes) => {
                  if (!currentVotes) {
                    return [];
                  }

                  const votesWithoutCurrent = currentVotes.filter(
                    (currentVote) => currentVote.messageId !== message.id
                  );

                  return [
                    ...votesWithoutCurrent,
                    {
                      chatId,
                      messageId: message.id,
                      isUpvoted: false,
                    },
                  ];
                },
                { revalidate: false }
              );

              return "Downvoted Response!";
            },
            error: "Failed to downvote response.",
          });
        }}
        tooltip="Downvote Response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }

    return true;
  }
);
