"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  ArrowUpIcon,
  BotIcon,
  BrainIcon,
  EyeIcon,
  FilePenLineIcon,
  GraduationCapIcon,
  LockIcon,
  Paperclip,
  PlusIcon,
  SearchIcon,
  WrenchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
  type ModelCapabilities,
} from "@/lib/ai/models";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { Button } from "../ui/button";
import { StopIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import {
  type SlashCommand,
  SlashCommandMenu,
  slashCommands,
} from "./slash-commands";
import { SuggestedActions } from "./suggested-actions";
import type { VisibilityType } from "./visibility-selector";

type UploadSource = "device" | "mai-library";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  // biome-ignore lint/suspicious/noDocumentCookie: needed for client-side cookie setting
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function getModelLogoProvider(
  model: Pick<ChatModel, "id" | "name" | "provider">
) {
  const id = model.id.toLowerCase();
  const name = model.name.toLowerCase();

  if (id.includes("deepseek") || name.includes("deepseek")) {
    return "deepseek";
  }
  if (id.includes("openai/") || id.includes("/gpt") || name.includes("gpt")) {
    return "openai";
  }
  if (id.includes("stepfun") || name.includes("step 1")) {
    return "stepfun";
  }
  if (id.includes("liquid/") || name.includes("lfm")) {
    return "liquid";
  }
  if (id.includes("gemini") || id.includes("/google/")) {
    return "google";
  }
  if (id.includes("gemma") || name.includes("gemma")) {
    return "google";
  }
  if (id.includes("phi-3.5") || name.includes("phi 3.5")) {
    return "microsoft";
  }
  if (id.includes("claude") || id.includes("/anthropic/")) {
    return "anthropic";
  }
  if (id.includes("nemotron")) {
    return "nvidia";
  }
  if (id.includes("llama")) {
    return "llama";
  }

  if (model.provider === "ollama") {
    return "llama";
  }
  return model.provider;
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  selectedModelId,
  onModelChange,
  editingMessage,
  onCancelEdit,
  isLoading,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage:
    | UseChatHelpers<ChatMessage>["sendMessage"]
    | (() => Promise<void>);
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const hasAutoFocused = useRef(false);
  useEffect(() => {
    if (!hasAutoFocused.current && width) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
    }
  }, [localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = event.target.value;
    setInput(val);

    if (val.startsWith("/") && !val.includes(" ")) {
      setSlashOpen(true);
      setSlashQuery(val.slice(1));
      setSlashIndex(0);
    } else {
      setSlashOpen(false);
    }
  };

  const handleSlashSelect = (cmd: SlashCommand) => {
    setSlashOpen(false);
    setInput("");
    switch (cmd.action) {
      case "new":
        router.push("/");
        break;
      case "clear":
        setMessages(() => []);
        break;
      case "rename":
        toast("Le renommage est disponible depuis le menu latéral.");
        break;
      case "model": {
        const modelBtn = document.querySelector<HTMLButtonElement>(
          "[data-testid='model-selector']"
        );
        modelBtn?.click();
        break;
      }
      case "theme":
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        break;
      case "delete":
        toast("Supprimer cette discussion ?", {
          action: {
            label: "Supprimer",
            onClick: () => {
              fetch(
                `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
                { method: "DELETE" }
              );
              router.push("/");
              toast.success("Discussion supprimée");
            },
          },
        });
        break;
      case "purge":
        toast("Supprimer toutes les discussions ?", {
          action: {
            label: "Tout supprimer",
            onClick: () => {
              fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
                method: "DELETE",
              });
              router.push("/");
              toast.success("Toutes les discussions ont été supprimées");
            },
          },
        });
        break;
      default:
        break;
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [chatBarSize] = useLocalStorage<"compact" | "standard" | "large">(
    "mai.chatbar.size",
    "compact"
  );
  const [uploadSource] = useLocalStorage<UploadSource>(
    "mai.upload-source",
    "mai-library"
  );

  const handleInsertTemplate = useCallback(
    (templateText: string) => {
      const normalizedTemplate = templateText.trim();
      if (!normalizedTemplate) {
        return;
      }

      setInput((previousInput) =>
        previousInput.trim()
          ? `${previousInput.trim()}\n\n${normalizedTemplate}`
          : normalizedTemplate
      );
      setLocalStorageInput((previousInput) =>
        previousInput.trim()
          ? `${previousInput.trim()}\n\n${normalizedTemplate}`
          : normalizedTemplate
      );
      setTimeout(() => textareaRef.current?.focus(), 50);
    },
    [setInput, setLocalStorageInput]
  );

  const submitForm = useCallback(() => {
    window.history.pushState(
      {},
      "",
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
    );

    // Read current contextual actions state safely (SSR-friendly)
    const isReasoningEnabled =
      typeof window === "undefined"
        ? false
        : localStorage.getItem("mai-reasoning-enabled") === "true";
    const isWebSearchEnabled =
      typeof window === "undefined"
        ? false
        : localStorage.getItem("mai-websearch-enabled") === "true";
    const isLearningEnabled =
      typeof window === "undefined"
        ? false
        : localStorage.getItem("mai-learning-enabled") === "true";
    const isGhostModeEnabled =
      typeof window === "undefined"
        ? false
        : localStorage.getItem("mai.ghost-mode") === "true";

    sendMessage({
      role: "user",
      parts: [
        ...attachments.map((attachment) => ({
          type: "file" as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        {
          type: "text",
          text: input,
        },
      ],
      // @ts-expect-error - appending to experimental body to be picked up by useChat
      experimental_append_body: {
        contextualActions: {
          isReasoningEnabled,
          isWebSearchEnabled,
          isLearningEnabled,
        },
        ghostMode: isGhostModeEnabled,
        uploadSource,
      },
    });

    setAttachments([]);
    setLocalStorageInput("");
    setInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    uploadSource,
  ]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (_error) {
      toast.error("Échec de l'envoi du fichier, veuillez réessayer.");
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (_error) {
        toast.error("Échec de l'envoi des fichiers.");
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) {
        return;
      }

      event.preventDefault();

      setUploadQueue((prev) => [...prev, "Image collée"]);

      try {
        const uploadPromises = imageItems
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
          .map((file) => uploadFile(file));

        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) =>
            attachment !== undefined &&
            attachment.url !== undefined &&
            attachment.contentType !== undefined
        );

        setAttachments((curr) => [
          ...curr,
          ...(successfullyUploadedAttachments as Attachment[]),
        ]);
      } catch (_error) {
        toast.error("Échec de l'envoi de l'image collée.");
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {editingMessage && onCancelEdit && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Modification du message</span>
          <button
            className="rounded px-1.5 py-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
            onMouseDown={(e) => {
              e.preventDefault();
              onCancelEdit();
            }}
            type="button"
          >
            Annuler
          </button>
        </div>
      )}

      {!editingMessage &&
        !isLoading &&
        messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            sendMessage={sendMessage}
          />
        )}

      <input
        className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <div className="relative">
        {slashOpen && (
          <SlashCommandMenu
            onClose={() => setSlashOpen(false)}
            onSelect={handleSlashSelect}
            query={slashQuery}
            selectedIndex={slashIndex}
          />
        )}
      </div>

      <PromptInput
        className="[&>div]:rounded-2xl [&>div]:border [&>div]:border-border/30 [&>div]:bg-card/70 [&>div]:shadow-[var(--shadow-composer)] [&>div]:transition-shadow [&>div]:duration-300 [&>div]:focus-within:shadow-[var(--shadow-composer-focus)]"
        onSubmit={() => {
          if (input.startsWith("/")) {
            const query = input.slice(1).trim();
            const cmd = slashCommands.find((c) => c.name === query);
            if (cmd) {
              handleSlashSelect(cmd);
            }
            return;
          }
          if (!input.trim() && attachments.length === 0) {
            return;
          }
          if (status === "ready" || status === "error") {
            submitForm();
          } else {
            toast.error("Veuillez attendre la fin de la réponse du modèle.");
          }
        }}
      >
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex w-full self-start flex-row gap-2 overflow-x-auto px-3 pt-3 no-scrollbar"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment
                attachment={attachment}
                key={attachment.url}
                onRemove={() => {
                  setAttachments((currentAttachments) =>
                    currentAttachments.filter((a) => a.url !== attachment.url)
                  );
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                attachment={{
                  url: "",
                  name: filename,
                  contentType: "",
                }}
                isUploading={true}
                key={filename}
              />
            ))}
          </div>
        )}
        <PromptInputTextarea
          className={cn(
            "text-[13px] leading-relaxed placeholder:text-muted-foreground/35",
            chatBarSize === "compact" && "min-h-20 px-3.5 pt-2.5 pb-1.5",
            chatBarSize === "standard" && "min-h-24 px-4 pt-3.5 pb-1.5",
            chatBarSize === "large" && "min-h-28 px-4.5 pt-4 pb-2"
          )}
          data-testid="multimodal-input"
          onChange={handleInput}
          onKeyDown={(e) => {
            if (slashOpen) {
              const filtered = slashCommands.filter((cmd) =>
                cmd.name.startsWith(slashQuery.toLowerCase())
              );
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSlashIndex((i) => Math.min(i + 1, filtered.length - 1));
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSlashIndex((i) => Math.max(i - 1, 0));
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                if (filtered[slashIndex]) {
                  handleSlashSelect(filtered[slashIndex]);
                }
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setSlashOpen(false);
                return;
              }
            }
            if (e.key === "Escape" && editingMessage && onCancelEdit) {
              e.preventDefault();
              onCancelEdit();
            }
          }}
          placeholder={
            editingMessage
              ? "Modifiez votre message..."
              : "Posez votre question..."
          }
          ref={textareaRef}
          value={input}
        />
        <PromptInputFooter className="px-3 pb-3">
          <PromptInputTools>
            <ContextualActionsMenu
              fileInputRef={fileInputRef}
              hasVision={true}
              onInsertTemplate={handleInsertTemplate}
              status={status}
            />
            <span className="h-7 rounded-full border border-border/40 bg-secondary/40 px-2 text-[10px] leading-7 text-muted-foreground">
              Source : Bibliothèque mAI
            </span>
            <ModelSelectorCompact
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
            />
          </PromptInputTools>

          {status === "submitted" ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <PromptInputSubmit
              className={cn(
                "h-7 w-7 rounded-xl transition-all duration-200",
                input.trim()
                  ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                  : "bg-muted text-muted-foreground/25 cursor-not-allowed"
              )}
              data-testid="send-button"
              disabled={!input.trim() || uploadQueue.length > 0}
              status={status}
              variant="secondary"
            >
              <ArrowUpIcon className="size-4" />
            </PromptInputSubmit>
          )}
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (!equal(prevProps.attachments, nextProps.attachments)) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }
    if (prevProps.editingMessage !== nextProps.editingMessage) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }

    return true;
  }
);

function PureContextualActionsMenu({
  fileInputRef,
  onInsertTemplate,
  status,
  hasVision,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  onInsertTemplate: (templateText: string) => void;
  status: UseChatHelpers<ChatMessage>["status"];
  hasVision: boolean;
}) {
  const [open, setOpen] = useState(false);

  // States to hold the toggled options (to pass to chat logic later)
  // For the moment, we just expose them or keep them in sync with local storage/context
  const [isReasoningEnabled, setIsReasoningEnabled] = useLocalStorage(
    "mai-reasoning-enabled",
    false
  );
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useLocalStorage(
    "mai-websearch-enabled",
    false
  );
  const [isLearningEnabled, setIsLearningEnabled] = useLocalStorage(
    "mai-learning-enabled",
    false
  );
  const [quizTopic, setQuizTopic] = useState("culture générale");
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const selectedActions: string[] = [];

  if (isReasoningEnabled) {
    selectedActions.push("Réflexion");
  }
  if (isWebSearchEnabled) {
    selectedActions.push("Recherche");
  }
  if (isLearningEnabled) {
    selectedActions.push("Apprentissage");
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <div className="flex items-center gap-1.5">
        <PopoverTrigger asChild>
          <Button
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/40 bg-secondary/50 p-1 text-foreground shadow-sm transition-colors hover:bg-secondary"
            data-testid="context-actions-button"
            disabled={status !== "ready"}
            variant="ghost"
          >
            <PlusIcon size={16} />
          </Button>
        </PopoverTrigger>
        {selectedActions.length > 0 && (
          <div className="max-w-[180px] truncate rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {selectedActions.join(" • ")}
          </div>
        )}
      </div>
      <PopoverContent
        align="start"
        className="flex w-72 flex-col gap-1 rounded-xl p-2 shadow-lg"
        sideOffset={8}
      >
        <Button
          className="flex h-8 w-full items-center justify-start gap-2 text-xs font-normal"
          onClick={() => {
            setOpen(false);
            if (hasVision) {
              fileInputRef.current?.click();
            } else {
              toast.error("Le modèle actuel ne supporte pas les images");
            }
          }}
          variant="ghost"
        >
          <Paperclip className="text-muted-foreground" size={16} />
          Ajouter photos/fichiers
        </Button>

        <div className="h-[1px] bg-border my-1 mx-2" />

        <Button
          className={cn(
            "flex h-8 w-full items-center justify-start gap-2 text-xs font-normal",
            isReasoningEnabled &&
              "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          )}
          onClick={() => setIsReasoningEnabled(!isReasoningEnabled)}
          variant="ghost"
        >
          <BrainIcon
            className={
              isReasoningEnabled ? "text-primary" : "text-muted-foreground"
            }
            size={16}
          />
          Réflexion
        </Button>

        <Button
          className={cn(
            "flex h-8 w-full items-center justify-start gap-2 text-xs font-normal",
            isWebSearchEnabled &&
              "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          )}
          onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
          variant="ghost"
        >
          <SearchIcon
            className={
              isWebSearchEnabled ? "text-primary" : "text-muted-foreground"
            }
            size={16}
          />
          Recherche approfondie
        </Button>

        <div className="my-1 rounded-lg border border-border/50 bg-background/60 p-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            Quiz IA
          </p>
          <input
            className="mt-2 h-8 w-full rounded-md border border-border/50 bg-background px-2 text-xs outline-none"
            onChange={(event) => setQuizTopic(event.target.value)}
            placeholder="Thème du quiz"
            value={quizTopic}
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              className="h-8 w-16 rounded-md border border-border/50 bg-background px-2 text-xs outline-none"
              max={20}
              min={1}
              onChange={(event) => {
                const parsedValue = Number.parseInt(event.target.value, 10);
                setQuizQuestionCount(
                  Number.isNaN(parsedValue)
                    ? 5
                    : Math.min(20, Math.max(1, parsedValue))
                );
              }}
              type="number"
              value={quizQuestionCount}
            />
            <Button
              className="h-8 flex-1 text-xs"
              onClick={() => {
                onInsertTemplate(
                  `Crée un quiz interactif sur le thème « ${quizTopic.trim() || "culture générale"} » avec ${quizQuestionCount} questions. Pour chaque question, propose 4 choix, indique la bonne réponse, puis ajoute une explication courte.`
                );
                setOpen(false);
              }}
              variant="secondary"
            >
              Générer Quiz
            </Button>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="flex h-8 w-full items-center justify-between gap-2 text-xs font-normal text-muted-foreground"
              variant="ghost"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-widest text-lg leading-none mt-[-8px]">
                  ...
                </span>{" "}
                Plus
              </div>
              <span className="text-xs">&gt;</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 p-2 shadow-lg rounded-xl"
            side="right"
          >
            <Button
              className="flex h-8 w-full items-center justify-start gap-2 text-xs font-normal"
              onClick={() => {
                onInsertTemplate(
                  "Ouvre un Canevas structuré pour ce travail, avec sections, objectifs et plan d'édition ciblé. Ensuite, commence par la section d'introduction."
                );
                setOpen(false);
              }}
              variant="ghost"
            >
              <FilePenLineIcon className="text-muted-foreground" size={16} />
              Ouvrir un Canevas
            </Button>
            <Button
              className={cn(
                "flex h-8 w-full items-center justify-start gap-2 text-xs font-normal",
                isLearningEnabled &&
                  "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
              )}
              onClick={() => setIsLearningEnabled(!isLearningEnabled)}
              variant="ghost"
            >
              <GraduationCapIcon
                className={
                  isLearningEnabled ? "text-primary" : "text-muted-foreground"
                }
                size={16}
              />
              Apprendre & Étudier
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </PopoverContent>
    </Popover>
  );
}

const ContextualActionsMenu = memo(PureContextualActionsMenu);

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: modelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 }
  );

  const capabilities: Record<string, ModelCapabilities> | undefined =
    modelsData?.capabilities ?? modelsData;
  const dynamicModels: ChatModel[] | undefined = modelsData?.models;
  const activeModels = dynamicModels ?? chatModels;

  const selectedModel =
    activeModels.find((m: ChatModel) => m.id === selectedModelId) ??
    activeModels.find((m: ChatModel) => m.id === DEFAULT_CHAT_MODEL) ??
    activeModels[0] ??
    chatModels[0];

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <Button
          className="h-7 max-w-[200px] justify-between gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          data-testid="model-selector"
          variant="ghost"
        >
          <ModelSelectorLogo provider={getModelLogoProvider(selectedModel)} />
          <ModelSelectorName>{selectedModel.name}</ModelSelectorName>
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorInput placeholder="Rechercher un modèle..." />
        <ModelSelectorList>
          {(() => {
            const curatedIds = new Set(chatModels.map((m) => m.id));
            const allModels = dynamicModels
              ? [
                  ...chatModels,
                  ...dynamicModels.filter((m) => !curatedIds.has(m.id)),
                ]
              : chatModels;

            const grouped: Record<
              string,
              { model: ChatModel; curated: boolean }[]
            > = {};
            for (const model of allModels) {
              const key = curatedIds.has(model.id)
                ? "_curated"
                : model.provider;
              if (!grouped[key]) {
                grouped[key] = [];
              }
              grouped[key].push({ model, curated: curatedIds.has(model.id) });
            }

            const customAgents = modelsData?.customAgents || [];

            const sortedKeys = Object.keys(grouped).sort((a, b) => {
              if (a === "_curated") {
                return -1;
              }
              if (b === "_curated") {
                return 1;
              }
              return a.localeCompare(b);
            });

            const providerNames: Record<string, string> = {
              alibaba: "Alibaba",
              anthropic: "Anthropic",
              "arcee-ai": "Arcee AI",
              bytedance: "ByteDance",
              cohere: "Cohere",
              deepseek: "DeepSeek",
              google: "Google",
              inception: "Inception",
              kwaipilot: "Kwaipilot",
              meituan: "Meituan",
              meta: "Meta",
              minimax: "MiniMax",
              mistral: "Mistral",
              moonshotai: "Moonshot",
              morph: "Morph",
              nvidia: "Nvidia",
              openai: "OpenAI",
              perplexity: "Perplexity",
              "prime-intellect": "Prime Intellect",
              xiaomi: "Xiaomi",
              xai: "xAI",
              zai: "Zai",
            };

            return (
              <>
                {customAgents.length > 0 && (
                  <ModelSelectorGroup heading="Mes mAIs">
                    {customAgents.map((agent: any) => (
                      <ModelSelectorItem
                        className={cn(
                          "flex w-full",
                          selectedModelId === `agent-${agent.id}` &&
                            "bg-muted/50"
                        )}
                        key={`agent-${agent.id}`}
                        onSelect={() => {
                          onModelChange?.(`agent-${agent.id}`);
                          setCookie("chat-model", `agent-${agent.id}`);
                          setOpen(false);
                          setTimeout(() => {
                            document
                              .querySelector<HTMLTextAreaElement>(
                                "[data-testid='multimodal-input']"
                              )
                              ?.focus();
                          }, 50);
                        }}
                        value={`agent-${agent.id}`}
                      >
                        {agent.image ? (
                          <div
                            className="mr-1 h-4 w-4 rounded-sm bg-cover bg-center"
                            style={{ backgroundImage: `url(${agent.image})` }}
                          />
                        ) : (
                          <BotIcon className="w-4 h-4 mr-1 text-primary" />
                        )}
                        <ModelSelectorName>{agent.name}</ModelSelectorName>
                      </ModelSelectorItem>
                    ))}
                  </ModelSelectorGroup>
                )}
                {sortedKeys.map((key) => (
                  <ModelSelectorGroup
                    heading={
                      key === "_curated"
                        ? undefined
                        : (providerNames[key] ?? key)
                    }
                    key={key}
                  >
                    {grouped[key].map(({ model, curated }) => {
                      const logoProvider = getModelLogoProvider(model);
                      return (
                        <ModelSelectorItem
                          className={cn(
                            "flex w-full",
                            model.id === selectedModel.id && "bg-muted/50",
                            !curated && "opacity-40 cursor-default"
                          )}
                          key={model.id}
                          onSelect={() => {
                            if (!curated) {
                              return;
                            }
                            onModelChange?.(model.id);
                            setCookie("chat-model", model.id);
                            setOpen(false);
                            setTimeout(() => {
                              document
                                .querySelector<HTMLTextAreaElement>(
                                  "[data-testid='multimodal-input']"
                                )
                                ?.focus();
                            }, 50);
                          }}
                          value={model.id}
                        >
                          <ModelSelectorLogo provider={logoProvider} />
                          <ModelSelectorName>{model.name}</ModelSelectorName>
                          <div className="ml-auto flex items-center gap-2 text-foreground/70">
                            {capabilities?.[model.id]?.tools && (
                              <WrenchIcon className="size-3.5" />
                            )}
                            {capabilities?.[model.id]?.vision && (
                              <EyeIcon className="size-3.5" />
                            )}
                            {capabilities?.[model.id]?.reasoning && (
                              <BrainIcon className="size-3.5" />
                            )}
                            {!curated && (
                              <LockIcon className="size-3 text-muted-foreground/50" />
                            )}
                          </div>
                        </ModelSelectorItem>
                      );
                    })}
                  </ModelSelectorGroup>
                ))}
              </>
            );
          })()}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  return (
    <Button
      className="h-7 w-7 rounded-xl bg-foreground p-1 text-background transition-all duration-200 hover:opacity-85 active:scale-95 disabled:bg-muted disabled:text-muted-foreground/25 disabled:cursor-not-allowed"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
