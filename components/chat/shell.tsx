"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useActiveChat } from "@/hooks/use-active-chat";
import {
  initialArtifactData,
  useArtifact,
  useArtifactSelector,
} from "@/hooks/use-artifact";
import { consumeTierCredit, getTierForModelId } from "@/lib/ai/credits";
import {
  defaultShortcuts,
  SHORTCUTS_STORAGE_KEY,
  type ShortcutConfig,
} from "@/lib/chat-preferences";
import { createAiResponseNotification } from "@/lib/notifications";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Artifact } from "./artifact";
import { DataStreamHandler } from "./data-stream-handler";
import { submitEditedMessage } from "./message-editor";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { ProductAnnouncements } from "./product-announcements";
import { VoiceTopActions } from "./voice-top-actions";

const TOKEN_USAGE_STORAGE_KEY = "mai.token-usage.v1";

function incrementOutputTokens(text: string) {
  if (typeof window === "undefined" || text.trim().length === 0) {
    return;
  }
  const estimated = Math.max(1, Math.ceil(text.length / 4));
  try {
    const raw = window.localStorage.getItem(TOKEN_USAGE_STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as { inputTokens?: number; outputTokens?: number })
      : {};
    const next = {
      inputTokens: Math.max(0, Math.floor(parsed.inputTokens ?? 0)),
      outputTokens:
        Math.max(0, Math.floor(parsed.outputTokens ?? 0)) + estimated,
    };
    window.localStorage.setItem(TOKEN_USAGE_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("mai:token-usage-updated"));
  } catch {
    // ignore malformed storage
  }
}

export function ChatShell() {
  const {
    chatId,
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    addToolApprovalResponse,
    input,
    setInput,
    visibilityType,
    isReadonly,
    isLoading,
    votes,
    currentModelId,
    setCurrentModelId,
    showCreditCardAlert,
    setShowCreditCardAlert,
  } = useActiveChat();

  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setArtifact } = useArtifact();

  const stopRef = useRef(stop);
  stopRef.current = stop;
  const previousStatusRef = useRef(status);
  const lastNotifiedAssistantIdRef = useRef<string | null>(null);

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      stopRef.current();
      setArtifact(initialArtifactData);
      setEditingMessage(null);
      setAttachments([]);
    }
  }, [chatId, setArtifact]);

  useEffect(() => {
    const normalize = (value: string) =>
      value.toLowerCase().replace(/\s+/g, "");
    const fromKeyboardEvent = (event: KeyboardEvent) =>
      normalize(
        [
          event.ctrlKey ? "ctrl" : null,
          event.altKey ? "alt" : null,
          event.shiftKey ? "shift" : null,
          event.key.toLowerCase(),
        ]
          .filter(Boolean)
          .join("+")
      );

    const handler = async (event: KeyboardEvent) => {
      const configRaw = window.localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      const shortcuts: ShortcutConfig = (() => {
        if (!configRaw) {
          return defaultShortcuts;
        }
        try {
          return JSON.parse(configRaw) as ShortcutConfig;
        } catch {
          return defaultShortcuts;
        }
      })();
      const combo = fromKeyboardEvent(event);
      const getLastAssistantMessage = () =>
        [...messages].reverse().find((message) => message.role === "assistant");

      if (combo === normalize(shortcuts.newChat)) {
        event.preventDefault();
        window.location.href = "/";
        return;
      }
      if (combo === normalize(shortcuts.copyMessage)) {
        event.preventDefault();
        const last = getLastAssistantMessage();
        const text = last?.parts
          ?.filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n");
        if (text) {
          await navigator.clipboard.writeText(text);
        }
        return;
      }
      if (combo === normalize(shortcuts.likeMessage)) {
        event.preventDefault();
        const last = getLastAssistantMessage();
        if (last) {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote`, {
            method: "PATCH",
            body: JSON.stringify({ chatId, messageId: last.id, type: "up" }),
          });
        }
        return;
      }
      if (combo === normalize(shortcuts.dislikeMessage)) {
        event.preventDefault();
        const last = getLastAssistantMessage();
        if (last) {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote`, {
            method: "PATCH",
            body: JSON.stringify({ chatId, messageId: last.id, type: "down" }),
          });
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [chatId, messages]);

  useEffect(() => {
    const rewriteHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        chatId: string;
        mode: "same" | "shorter" | "longer";
        text: string;
      }>;
      if (customEvent.detail.chatId !== chatId || status !== "ready") {
        return;
      }
      const modeLabel =
        customEvent.detail.mode === "shorter"
          ? "plus concise"
          : customEvent.detail.mode === "longer"
            ? "plus détaillée"
            : "équivalente";
      sendMessage({
        role: "user",
        parts: [
          {
            type: "text",
            text: `Réécris la dernière réponse en version ${modeLabel}. Conserve le contexte.\n\nRéponse à réécrire:\n${customEvent.detail.text}`,
          },
        ],
      });
    };
    window.addEventListener(
      "mai:rewrite-message",
      rewriteHandler as EventListener
    );
    return () =>
      window.removeEventListener(
        "mai:rewrite-message",
        rewriteHandler as EventListener
      );
  }, [chatId, sendMessage, status]);

  useEffect(() => {
    const isGenerating = status === "submitted" || status === "streaming";
    window.dispatchEvent(
      new CustomEvent("mai:chat-stream-status", {
        detail: { chatId, isGenerating },
      })
    );

    if (isGenerating) {
      sessionStorage.setItem("mai.chat.streaming.chatId", chatId);
      return;
    }

    if (sessionStorage.getItem("mai.chat.streaming.chatId") === chatId) {
      sessionStorage.removeItem("mai.chat.streaming.chatId");
    }
  }, [chatId, status]);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    const wasGenerating =
      previousStatus === "submitted" || previousStatus === "streaming";
    const isReady = status === "ready";
    const isError = status === "error";

    const latestAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    const latestAssistantText = latestAssistantMessage?.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();
    const preview =
      latestAssistantText && latestAssistantText.length > 160
        ? `${latestAssistantText.slice(0, 157)}…`
        : latestAssistantText;

    if (
      wasGenerating &&
      isReady &&
      latestAssistantMessage?.id &&
      latestAssistantMessage.id !== lastNotifiedAssistantIdRef.current
    ) {
      const tier = getTierForModelId(currentModelId);
      consumeTierCredit(tier);
      const isGhostConversation =
        sessionStorage.getItem("mai.ghost-chat-id") === chatId;
      if (!isGhostConversation) {
        incrementOutputTokens(latestAssistantText ?? "");
      }
      createAiResponseNotification({
        phase: "completed",
        chatId,
        assistantMessageId: latestAssistantMessage.id,
        modelId: currentModelId,
        preview,
      });
      lastNotifiedAssistantIdRef.current = latestAssistantMessage.id;
    }

    if (wasGenerating && isError) {
      createAiResponseNotification({
        phase: "error",
        chatId,
        modelId: currentModelId,
      });
    }

    previousStatusRef.current = status;
  }, [chatId, currentModelId, messages, status]);

  return (
    <>
      <ProductAnnouncements />
      <div className="flex h-dvh w-full flex-row overflow-hidden">
        <div
          className={cn(
            "flex min-w-0 flex-col bg-sidebar/45 transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isArtifactVisible ? "w-[40%]" : "w-full"
          )}
        >
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background/70 md:rounded-tl-[16px] md:border-t md:border-l md:border-border/30 md:shadow-[var(--shadow-float)]">
            <VoiceTopActions chatId={chatId} messages={messages} />
            <Messages
              addToolApprovalResponse={addToolApprovalResponse}
              chatId={chatId}
              isArtifactVisible={isArtifactVisible}
              isLoading={isLoading}
              isReadonly={isReadonly}
              messages={messages}
              onEditMessage={(msg) => {
                const text = msg.parts
                  ?.filter((p) => p.type === "text")
                  .map((p) => p.text)
                  .join("");
                setInput(text ?? "");
                setEditingMessage(msg);
              }}
              regenerate={regenerate}
              selectedModelId={currentModelId}
              setMessages={setMessages}
              status={status}
              votes={votes}
            />

            <div className="sticky bottom-0 z-[1] mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-transparent px-2 pb-3 md:px-4 md:pb-4">
              {!isReadonly && (
                <MultimodalInput
                  attachments={attachments}
                  chatId={chatId}
                  editingMessage={editingMessage}
                  input={input}
                  isLoading={isLoading}
                  messages={messages}
                  onCancelEdit={() => {
                    setEditingMessage(null);
                    setInput("");
                  }}
                  onModelChange={setCurrentModelId}
                  selectedModelId={currentModelId}
                  selectedVisibilityType={visibilityType}
                  sendMessage={
                    editingMessage
                      ? async () => {
                          const msg = editingMessage;
                          setEditingMessage(null);
                          await submitEditedMessage({
                            message: msg,
                            text: input,
                            setMessages,
                            regenerate,
                          });
                          setInput("");
                        }
                      : sendMessage
                  }
                  setAttachments={setAttachments}
                  setInput={setInput}
                  setMessages={setMessages}
                  status={status}
                  stop={stop}
                />
              )}
            </div>
          </div>
        </div>

        <Artifact
          addToolApprovalResponse={addToolApprovalResponse}
          attachments={attachments}
          chatId={chatId}
          input={input}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={currentModelId}
          selectedVisibilityType={visibilityType}
          sendMessage={sendMessage}
          setAttachments={setAttachments}
          setInput={setInput}
          setMessages={setMessages}
          status={status}
          stop={stop}
          votes={votes}
        />
      </div>

      <DataStreamHandler />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activation requise</AlertDialogTitle>
            <AlertDialogDescription>
              Le service IA n&apos;est pas encore activé sur cet environnement.
              Ajoutez un moyen de paiement pour débloquer l&apos;accès.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`;
              }}
            >
              Activer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
