"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  ArrowUpIcon,
  CircleHelpIcon,
  FilePenLineIcon,
  Ghost,
  Globe2Icon,
  GraduationCapIcon,
  ImageIcon,
  LockIcon,
  MicIcon,
  Music2Icon,
  Paperclip,
  PinIcon,
  PlusIcon,
  Puzzle,
  SearchIcon,
  SparklesIcon,
  Square,
  StarIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import {
  areAllTierCreditsExhausted,
  getFallbackTier,
  getFirstModelForTier,
  getTierForModelId,
  getTierLabel,
  getTierRemaining,
} from "@/lib/ai/credits";
import { resolveModelLogoProvider } from "@/lib/ai/model-brand";
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
} from "@/lib/ai/models";
import { parseFileForAi, validateFileBeforeUpload } from "@/lib/file-parser";
import { createNotification } from "@/lib/notifications";
import { pluginRegistry } from "@/lib/plugins/registry";
import {
  DEFAULT_IMAGE_MODEL_KEY,
  DEFAULT_MUSIC_MODEL_KEY,
  FALLBACK_DEFAULT_IMAGE_MODEL,
  FALLBACK_DEFAULT_MUSIC_MODEL,
} from "@/lib/default-models";
import type { Attachment, ChatMessage } from "@/lib/types";
import { triggerHaptic } from "@/lib/haptics";
import { addStatsEvent } from "@/lib/user-stats";
import { consumeUsage } from "@/lib/usage-limits";
import { cn, fetcher } from "@/lib/utils";
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
  defaultSlashCommands,
  filterSlashCommands,
  getActiveSlashCommands,
  type SlashCommand,
  SlashCommandMenu,
} from "./slash-commands";
import { SuggestedActions } from "./suggested-actions";
import type { VisibilityType } from "./visibility-selector";

type UploadSource = "device" | "mai-library";
type ReflectionLevel = "none" | "low" | "medium" | "high";
type ProjectItem = { id: string; name: string };
type MentionItem =
  | { id: string; label: string; type: "project" }
  | {
      description: string;
      id: string;
      label: string;
      type: "tool";
    };
const PROFILE_SETTINGS_STORAGE_KEY = "mai.profile.settings.v2";
const GHOST_CHAT_ID_STORAGE_KEY = "mai.ghost-chat-id";
const GHOST_MODE_STORAGE_KEY = "mai.ghost-mode";
const GHOST_MODE_UPDATED_EVENT = "mai:ghost-mode-updated";
const MAX_PERSISTENT_MEMORY_CHARS = 4000;
const TOKEN_USAGE_STORAGE_KEY = "mai.token-usage.v1";
const PLUGIN_MODE_STORAGE_KEY = "mai.plugin-mode";
const PLUGIN_ENABLED_STORAGE_KEY = "mai.plugins.enabled.v1";
const IMAGE_CREATION_MODE_STORAGE_KEY = "mai.image-creation-mode.enabled";
const MUSIC_CREATION_MODE_STORAGE_KEY = "mai.music-creation-mode.enabled";
const reflectionLevels: ReflectionLevel[] = ["none", "low", "medium", "high"];

const toolMentionItems: MentionItem[] = [];

function getPersistentMemoryFromLocalStorage(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const rawProfile = window.localStorage.getItem(
      PROFILE_SETTINGS_STORAGE_KEY
    );
    if (!rawProfile) {
      return undefined;
    }

    const parsedProfile = JSON.parse(rawProfile) as {
      aiMemory?: unknown;
      aiMemoryEntries?: unknown;
    };

    const textMemory =
      typeof parsedProfile.aiMemory === "string" ? parsedProfile.aiMemory : "";
    const listMemory = Array.isArray(parsedProfile.aiMemoryEntries)
      ? parsedProfile.aiMemoryEntries
          .filter((entry): entry is string => typeof entry === "string")
          .join("\n")
      : "";

    const mergedMemory = [listMemory, textMemory]
      .map((value) => value.trim())
      .filter(Boolean)
      .join("\n")
      .slice(0, MAX_PERSISTENT_MEMORY_CHARS);

    return mergedMemory.length > 0 ? mergedMemory : undefined;
  } catch {
    return undefined;
  }
}

function getCustomSystemPromptFromLocalStorage(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const rawProfile = window.localStorage.getItem(
      PROFILE_SETTINGS_STORAGE_KEY
    );
    if (!rawProfile) {
      return undefined;
    }

    const parsedProfile = JSON.parse(rawProfile) as {
      aiName?: unknown;
      aiPersonality?: unknown;
      personalContext?: unknown;
      profession?: unknown;
      stylisticDirectives?: unknown;
    };

    const aiName =
      typeof parsedProfile.aiName === "string"
        ? parsedProfile.aiName.trim()
        : "";
    const aiPersonality =
      typeof parsedProfile.aiPersonality === "string"
        ? parsedProfile.aiPersonality.trim()
        : "";
    const personalContext =
      typeof parsedProfile.personalContext === "string"
        ? parsedProfile.personalContext.trim()
        : "";
    const profession =
      typeof parsedProfile.profession === "string"
        ? parsedProfile.profession.trim()
        : "";
    const stylisticDirectives =
      typeof parsedProfile.stylisticDirectives === "string"
        ? parsedProfile.stylisticDirectives.trim()
        : "";

    const blocks = [
      aiName ? `Nom de l'assistant: ${aiName}` : "",
      aiPersonality ? `Personnalité souhaitée: ${aiPersonality}` : "",
      personalContext
        ? `Contexte personnel utilisateur: ${personalContext}`
        : "",
      profession ? `Profession utilisateur: ${profession}` : "",
      stylisticDirectives
        ? `Directives stylistiques: ${stylisticDirectives}`
        : "",
    ].filter(Boolean);

    if (blocks.length === 0) {
      return undefined;
    }

    return [
      "[Personnalisation IA utilisateur]",
      ...blocks,
      "Applique strictement ces préférences sans ignorer les règles de sécurité.",
    ].join("\n");
  } catch {
    return undefined;
  }
}

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  // biome-ignore lint/suspicious/noDocumentCookie: needed for client-side cookie setting
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function incrementInputTokens(text: string) {
  if (typeof window === "undefined") {
    return;
  }

  const estimated = Math.max(1, Math.ceil(text.length / 4));
  try {
    const raw = window.localStorage.getItem(TOKEN_USAGE_STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as { inputTokens?: number; outputTokens?: number })
      : {};
    const next = {
      inputTokens: Math.max(0, Math.floor(parsed.inputTokens ?? 0)) + estimated,
      outputTokens: Math.max(0, Math.floor(parsed.outputTokens ?? 0)),
    };
    window.localStorage.setItem(TOKEN_USAGE_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("mai:token-usage-updated"));
  } catch {
    // ignore malformed storage
  }
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
  const { plan, isHydrated } = useSubscriptionPlan();
  const { status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";
  const allModelIds = useMemo(() => chatModels.map((model) => model.id), []);
  const lastCreditRedirectKeyRef = useRef<string | null>(null);
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

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const currentTier = getTierForModelId(selectedModelId);
    const currentRemaining = getTierRemaining(
      currentTier,
      plan,
      isAuthenticated
    ).remaining;

    if (currentRemaining > 0) {
      return;
    }

    const fallbackTier = getFallbackTier(currentTier, plan, isAuthenticated);
    const fallbackModelId = fallbackTier
      ? getFirstModelForTier(fallbackTier, allModelIds)
      : null;

    if (!fallbackTier || !fallbackModelId) {
      return;
    }

    const redirectKey = `${selectedModelId}->${fallbackModelId}`;
    if (lastCreditRedirectKeyRef.current === redirectKey) {
      return;
    }

    lastCreditRedirectKeyRef.current = redirectKey;
    onModelChange?.(fallbackModelId);
    setCookie("chat-model", fallbackModelId);
    const message = `${getTierLabel(currentTier)} épuisé. Modèle basculé vers ${getTierLabel(fallbackTier)}.`;
    toast.warning(message);
    createNotification({
      level: "warning",
      message,
      source: "system",
      title: "Crédits IA",
    });
  }, [
    allModelIds,
    isAuthenticated,
    isHydrated,
    onModelChange,
    plan,
    selectedModelId,
  ]);

  useEffect(() => {
    const pendingKey = "mai.chat.pending-library-attachments";
    const raw = localStorage.getItem(pendingKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Attachment[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setAttachments((current) => {
          const existingUrls = new Set(current.map((item) => item.url));
          const merged = [...current];
          for (const item of parsed) {
            if (!existingUrls.has(item.url)) {
              merged.push(item);
            }
          }
          return merged;
        });
      }
    } catch {
      // ignore invalid local cache
    } finally {
      localStorage.removeItem(pendingKey);
    }
  }, [setAttachments]);

  useEffect(() => {
    const voiceSubmitHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        chatId?: string;
        text?: string;
      }>;
      const text = customEvent.detail?.text?.trim();
      if (!text || status !== "ready") {
        return;
      }

      setInput(text);
      void (sendMessage as UseChatHelpers<ChatMessage>["sendMessage"])({
        role: "user",
        parts: [{ type: "text", text }],
      });
    };

    window.addEventListener(
      "mai:voice-submit",
      voiceSubmitHandler as EventListener
    );
    return () =>
      window.removeEventListener(
        "mai:voice-submit",
        voiceSubmitHandler as EventListener
      );
  }, [sendMessage, setInput, status]);

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

    const mentionMatch = val.match(/(?:^|\s)@([^\s@]*)$/);
    if (mentionMatch) {
      setProjectMentionOpen(true);
      setProjectMentionQuery(mentionMatch[1] ?? "");
      setProjectMentionIndex(0);
    } else {
      setProjectMentionOpen(false);
    }
  };

  const replaceLastMention = useCallback(
    (value: string) => value.replace(/(?:^|\s)@([^\s@]*)$/, " ").trimStart(),
    []
  );

  const handleMentionSelect = useCallback(
    (item: MentionItem) => {
      if (item.type === "project") {
        setInput((current) => replaceLastMention(current));
        setProjectMentionOpen(false);
        router.replace(`${window.location.pathname}?projectId=${item.id}`);
        toast.success(`Projet sélectionné : ${item.label.replace(/^@/, "")}`);
        return;
      }

      setInput((current) => `${replaceLastMention(current)}${item.label} `);
      setProjectMentionOpen(false);
      toast.success(`Outil activé : ${item.label}`);
    },
    [replaceLastMention, router, setInput]
  );

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
      case "resume":
        setInput(
          "Résume les points clés de notre conversation en 5 puces actionnables."
        );
        break;
      case "code":
        setInput(
          "Réponds en mode code: propose une solution TypeScript stricte, avec explication courte."
        );
        break;
      case "quiz":
        router.push(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/quiz?topic=${encodeURIComponent("culture générale")}&difficulty=moyen&count=5&timer=10`
        );
        break;
      case "template":
        setInput((current) =>
          current.trim() ? `${current}\n/${cmd.name}` : `/${cmd.name} `
        );
        break;
      default:
        break;
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const liveWordCount = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return 0;
    }
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [input]);

  const liveCharacterCount = input.length;

  const [extractedFiles, setExtractedFiles] = useState<
    Array<{ name: string; text: string }>
  >([]);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [availableSlashCommands, setAvailableSlashCommands] =
    useState<SlashCommand[]>(defaultSlashCommands);
  const filteredSlashCommands = useMemo(
    () => filterSlashCommands(availableSlashCommands, slashQuery),
    [availableSlashCommands, slashQuery]
  );
  useEffect(() => {
    if (slashIndex < filteredSlashCommands.length) {
      return;
    }
    setSlashIndex(0);
  }, [filteredSlashCommands.length, slashIndex]);
  const [projectMentionOpen, setProjectMentionOpen] = useState(false);
  const [projectMentionQuery, setProjectMentionQuery] = useState("");
  const [projectMentionIndex, setProjectMentionIndex] = useState(0);
  const [chatBarSize] = useLocalStorage<"compact" | "standard" | "large">(
    "mai.chatbar.size",
    "compact"
  );
  const [showWordCounter] = useLocalStorage("mai.show-word-counter", false);
  const [uploadSource] = useLocalStorage<UploadSource>(
    "mai.upload-source",
    "mai-library"
  );
  const [isGhostModeArmed, setIsGhostModeArmed] = useState(false);
  const [isGhostConversation, setIsGhostConversation] = useState(false);

  const [isGeolocationEnabled, setIsGeolocationEnabled] = useLocalStorage(
    "mai.geolocation-enabled",
    false
  );
  const { data: projectsData } = useSWR<ProjectItem[]>(
    projectMentionOpen ? "/api/projects" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000,
    }
  );
  const filteredProjects = (projectsData ?? []).filter((project) =>
    project.name.toLowerCase().includes(projectMentionQuery.toLowerCase())
  );
  const mentionItems: MentionItem[] = [
    ...filteredProjects.map((project) => ({
      id: project.id,
      label: `@${project.name}`,
      type: "project" as const,
    })),
    ...toolMentionItems,
  ].filter((item) =>
    item.label.toLowerCase().includes(`@${projectMentionQuery.toLowerCase()}`)
  );
  const [geolocationPos, setGeolocationPos] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncGhostState = () => {
      setIsGhostModeArmed(
        localStorage.getItem(GHOST_MODE_STORAGE_KEY) === "true"
      );
      setIsGhostConversation(
        sessionStorage.getItem(GHOST_CHAT_ID_STORAGE_KEY) === chatId
      );
    };

    syncGhostState();
    window.addEventListener("storage", syncGhostState);
    window.addEventListener("focus", syncGhostState);
    window.addEventListener(GHOST_MODE_UPDATED_EVENT, syncGhostState);

    return () => {
      window.removeEventListener("storage", syncGhostState);
      window.removeEventListener("focus", syncGhostState);
      window.removeEventListener(GHOST_MODE_UPDATED_EVENT, syncGhostState);
    };
  }, [chatId]);

  useEffect(() => {
    if (isGeolocationEnabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeolocationPos({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("Erreur géolocalisation:", err);
          setIsGeolocationEnabled(false);
        }
      );
    } else if (!isGeolocationEnabled) {
      setGeolocationPos(null);
    }
  }, [isGeolocationEnabled, setIsGeolocationEnabled]);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const response = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          if (data.transcript) {
            setInput((prev) =>
              prev ? `${prev} ${data.transcript}` : data.transcript
            );
          }
        } catch (error) {
          console.error("Transcription failed", error);
        }

        for (const track of stream.getTracks()) {
          track.stop();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone", error);
    }
  };

  const isSendingRef = useRef(false);

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

  const sendPrompt = useCallback(
    ({
      prompt,
      promptAttachments,
    }: {
      prompt: string;
      promptAttachments: Attachment[];
    }) => {
      if (!prompt.trim() && promptAttachments.length === 0) {
        return;
      }

      const currentTier = getTierForModelId(selectedModelId);
      const tierCreditState = getTierRemaining(
        currentTier,
        plan,
        isAuthenticated
      );
      if (tierCreditState.remaining <= 0) {
        const fallbackTier = getFallbackTier(
          currentTier,
          plan,
          isAuthenticated
        );
        if (fallbackTier) {
          const fallbackModelId = getFirstModelForTier(
            fallbackTier,
            allModelIds
          );
          if (fallbackModelId) {
            onModelChange?.(fallbackModelId);
            setCookie("chat-model", fallbackModelId);
            const message = `${getTierLabel(currentTier)} épuisé. Bascule automatique vers ${getTierLabel(fallbackTier)}.`;
            toast.warning(message);
            createNotification({
              level: "warning",
              message,
              source: "system",
              title: "Crédits IA",
            });
            return;
          }
        } else if (areAllTierCreditsExhausted(plan, isAuthenticated)) {
          const message =
            "Tous vos quotas IA sont épuisés pour aujourd'hui. Revenez après la réinitialisation des crédits.";
          toast.error(message);
          createNotification({
            level: "error",
            message,
            source: "system",
            title: "Crédits IA",
          });
          return;
        } else {
          const message = `${getTierLabel(currentTier)} épuisé pour aujourd'hui. Choisissez un autre modèle.`;
          toast.error(message);
          createNotification({
            level: "error",
            message,
            source: "system",
            title: "Crédits IA",
          });
          return;
        }
      }

      if (status !== "ready" && status !== "error") {
        toast.error("Veuillez attendre la fin de la réponse du modèle.");
        return;
      }

      if (isSendingRef.current) {
        return;
      }

      isSendingRef.current = true;

      window.history.pushState(
        {},
        "",
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
      );

      const isReasoningEnabled =
        typeof window === "undefined"
          ? false
          : localStorage.getItem("mai-reasoning-enabled") === "true";
      const reasoningLevel = (() => {
        if (typeof window === "undefined") {
          return "medium" as ReflectionLevel;
        }

        const storedLevel = localStorage.getItem("mai-reasoning-level");
        return storedLevel &&
          reflectionLevels.includes(storedLevel as ReflectionLevel)
          ? (storedLevel as ReflectionLevel)
          : "medium";
      })();
      const isWebSearchEnabled =
        typeof window === "undefined"
          ? false
          : localStorage.getItem("mai-websearch-enabled") === "true";
      const forceWebSearchEnabled =
        typeof window === "undefined"
          ? false
          : localStorage.getItem("mai-websearch-force-enabled") === "true";
      const isLearningEnabled =
        typeof window === "undefined"
          ? false
          : localStorage.getItem("mai-learning-enabled") === "true";
      const isGhostModeEnabled =
        typeof window === "undefined"
          ? false
          : localStorage.getItem(GHOST_MODE_STORAGE_KEY) === "true";
      const persistentMemory = getPersistentMemoryFromLocalStorage();
      const customSystemPrompt = getCustomSystemPromptFromLocalStorage();

      const extractedFileContext = extractedFiles
        .filter((item) => item.text.trim().length > 0)
        .map((item) => `### Fichier: ${item.name}\n${item.text}`)
        .join("\n\n")
        .trim();

      const pluginMode =
        typeof window === "undefined"
          ? "none"
          : (localStorage.getItem(PLUGIN_MODE_STORAGE_KEY) ?? "none");
      const isImageCreationModeEnabled =
        typeof window === "undefined"
          ? false
          : localStorage.getItem(IMAGE_CREATION_MODE_STORAGE_KEY) === "true";
      const isMusicCreationModeEnabled =
        typeof window === "undefined"
          ? false
          : localStorage.getItem(MUSIC_CREATION_MODE_STORAGE_KEY) === "true";
      const forcedWebSearchBlock = forceWebSearchEnabled
        ? [
            "[RECHERCHE WEB OBLIGATOIRE]",
            "Commence impérativement par appeler l'outil webSearch.",
            "Base ta réponse principale sur les résultats web retournés.",
          ].join("\n")
        : "";
      const imageCreationBlock = isImageCreationModeEnabled
        ? [
            "[MODE CRÉATION D'IMAGES]",
            "L'utilisateur veut générer des images.",
            `Modèle image par défaut du compte: ${
              typeof window === "undefined"
                ? FALLBACK_DEFAULT_IMAGE_MODEL
                : (localStorage.getItem(DEFAULT_IMAGE_MODEL_KEY) ??
                  FALLBACK_DEFAULT_IMAGE_MODEL)
            }.`,
            "Avant de proposer la génération, demande d'abord:",
            "1) le modèle image à utiliser,",
            "2) le nombre d'images (1 à 4),",
            "3) la taille souhaitée (ex: 1024x1024).",
            "Quand ces informations sont fournies, termine par une action claire: proposer de lancer immédiatement Studio avec ces paramètres.",
          ].join("\n")
        : "";
      const musicCreationBlock = isMusicCreationModeEnabled
        ? [
            "[MODE CRÉATION DE MUSIQUE]",
            "L'utilisateur veut créer une musique (Wave).",
            `Modèle Wave par défaut du compte: ${
              typeof window === "undefined"
                ? FALLBACK_DEFAULT_MUSIC_MODEL
                : (localStorage.getItem(DEFAULT_MUSIC_MODEL_KEY) ??
                  FALLBACK_DEFAULT_MUSIC_MODEL)
            }.`,
            "Avant de proposer la génération, pose un mini-formulaire:",
            "1) style/genre musical,",
            "2) instrumental ou chanté,",
            "3) modèle Wave (V5_5, V5, V4_5PLUS, V4_5ALL, V4_5, V4),",
            "4) durée/structure souhaitée.",
            "Quand les informations sont réunies, conclure avec une action concrète: lancer la génération Wave maintenant.",
          ].join("\n")
        : "";
      if (isMusicCreationModeEnabled && typeof window !== "undefined") {
        const key = "mai.wave.prefill.prompts.v1";
        const raw = localStorage.getItem(key);
        const current = raw ? (JSON.parse(raw) as string[]) : [];
        localStorage.setItem(key, JSON.stringify([prompt, ...current].slice(0, 20)));
      }

      sendMessage({
        role: "user",
        parts: [
          ...promptAttachments.map((attachment) => ({
            type: "file" as const,
            url: attachment.url,
            name: attachment.name,
            mediaType: attachment.contentType,
          })),
          {
            type: "text",
            text: extractedFileContext
              ? `${forcedWebSearchBlock ? `${forcedWebSearchBlock}\n\n` : ""}${
                  imageCreationBlock ? `${imageCreationBlock}\n\n` : ""
                }${
                  musicCreationBlock ? `${musicCreationBlock}\n\n` : ""
                }${prompt}

[Contexte extrait des fichiers]
${extractedFileContext}`
              : `${forcedWebSearchBlock ? `${forcedWebSearchBlock}\n\n` : ""}${
                  imageCreationBlock ? `${imageCreationBlock}\n\n` : ""
                }${
                  musicCreationBlock ? `${musicCreationBlock}\n\n` : ""
                }${prompt}`,
          },
        ],
        // @ts-expect-error - appending to experimental body to be picked up by useChat
        experimental_append_body: {
          contextualActions: {
            isReasoningEnabled,
            reasoningLevel,
            isWebSearchEnabled,
            forceWebSearchEnabled,
            isLearningEnabled,
            isImageCreationModeEnabled,
            pluginMode,
            enabledPlugins:
              typeof window === "undefined"
                ? []
                : (() => {
                    try {
                      const raw = localStorage.getItem(PLUGIN_ENABLED_STORAGE_KEY);
                      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
                      return Array.isArray(parsed)
                        ? parsed.filter(
                            (item): item is string => typeof item === "string"
                          )
                        : [];
                    } catch {
                      return [];
                    }
                  })(),
          },
          clientGeolocation: geolocationPos,
          ghostMode: isGhostModeEnabled,
          uploadSource,
          persistentMemory,
          customSystemPrompt,
        },
      });
      triggerHaptic(14);
      if (isAuthenticated) {
        addStatsEvent("message", 1);
        if (isWebSearchEnabled || forceWebSearchEnabled) {
          addStatsEvent("websearch", 1);
        }
      }

      if (isWebSearchEnabled || forceWebSearchEnabled) {
        consumeUsage("websearch", "day");
        window.dispatchEvent(new Event("mai:websearch-usage-updated"));
      }

      if (isGhostModeEnabled && typeof window !== "undefined") {
        // One-shot toggle: we consume the switch immediately but keep this chat
        // flagged as ghost to prevent any later persistence on follow-up requests.
        sessionStorage.setItem(GHOST_CHAT_ID_STORAGE_KEY, chatId);
        localStorage.setItem(GHOST_MODE_STORAGE_KEY, "false");
        window.dispatchEvent(new Event(GHOST_MODE_UPDATED_EVENT));
        setIsGhostModeArmed(false);
        setIsGhostConversation(true);
      } else {
        incrementInputTokens(prompt);
      }

      setAttachments([]);
      setExtractedFiles([]);
      setLocalStorageInput("");
      setInput("");

      if (width && width > 768) {
        textareaRef.current?.focus();
      }

      window.setTimeout(() => {
        isSendingRef.current = false;
      }, 250);
    },
    [
      allModelIds,
      chatId,
      extractedFiles,
      geolocationPos,
      isAuthenticated,
      onModelChange,
      plan,
      sendMessage,
      setAttachments,
      status,
      selectedModelId,
      setInput,
      setLocalStorageInput,
      uploadSource,
      width,
    ]
  );

  const submitForm = useCallback(() => {
    sendPrompt({ prompt: input, promptAttachments: attachments });
  }, [attachments, input, sendPrompt]);

  useEffect(() => {
    setAvailableSlashCommands(getActiveSlashCommands());
  }, []);

  useEffect(() => {
    const handleInlineSuggestion = (event: Event) => {
      if (status !== "ready" && status !== "error") {
        toast.error("Veuillez attendre la fin de la réponse du modèle.");
        return;
      }

      const customEvent = event as CustomEvent<{ prompt?: string }>;
      const prompt = customEvent.detail?.prompt?.trim();

      if (!prompt) {
        return;
      }

      sendPrompt({ prompt, promptAttachments: [] });
    };

    window.addEventListener("mai.inline-suggestion", handleInlineSuggestion);

    return () => {
      window.removeEventListener(
        "mai.inline-suggestion",
        handleInlineSuggestion
      );
    };
  }, [sendPrompt, status]);

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

  const processFiles = useCallback(
    async (files: File[]) => {
      if (areAllTierCreditsExhausted(plan, isAuthenticated)) {
        toast.error(
          "Crédits IA épuisés: ajout de fichiers bloqué jusqu'à réinitialisation."
        );
        return;
      }

      const rejectedFiles = files
        .map((file) => validateFileBeforeUpload(file))
        .filter((error): error is string => Boolean(error));

      for (const error of rejectedFiles) {
        toast.error(error);
      }

      const acceptedFiles = files.filter(
        (file) => validateFileBeforeUpload(file) === null
      );

      if (acceptedFiles.length === 0) {
        return;
      }

      setUploadQueue(acceptedFiles.map((file) => file.name));

      try {
        const parsedResults = await Promise.all(
          acceptedFiles.map(async (file) => {
            const parsed = await parseFileForAi(file);
            return { name: file.name, text: parsed.extractedText };
          })
        );

        setExtractedFiles((current) => [...current, ...parsedResults]);

        const uploadPromises = acceptedFiles.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );
        for (
          let index = 0;
          index < successfullyUploadedAttachments.length;
          index += 1
        ) {
          consumeUsage("files", "day");
        }

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
        triggerHaptic(10);
      } catch (_error) {
        toast.error("Échec de l'envoi des fichiers.");
      } finally {
        setUploadQueue([]);
      }
    },
    [isAuthenticated, plan, setAttachments, uploadFile]
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      await processFiles(files);
    },
    [processFiles]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (areAllTierCreditsExhausted(plan, isAuthenticated)) {
        toast.error(
          "Crédits IA épuisés: ajout d'image bloqué jusqu'à réinitialisation."
        );
        return;
      }

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
        for (
          let index = 0;
          index < successfullyUploadedAttachments.length;
          index += 1
        ) {
          consumeUsage("files", "day");
        }

        setAttachments((curr) => [
          ...curr,
          ...(successfullyUploadedAttachments as Attachment[]),
        ]);
        triggerHaptic(10);
      } catch (_error) {
        toast.error("Échec de l'envoi de l'image collée.");
      } finally {
        setUploadQueue([]);
      }
    },
    [isAuthenticated, plan, setAttachments, uploadFile]
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
    <div className={cn("relative flex w-full flex-col gap-2", className)}>
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
            commands={availableSlashCommands}
            onClose={() => setSlashOpen(false)}
            onSelect={handleSlashSelect}
            query={slashQuery}
            selectedIndex={slashIndex}
          />
        )}
      </div>

      <PromptInput
        className={cn(
          "[&>div]:liquid-panel [&>div]:rounded-[1.35rem] [&>div]:transition-shadow [&>div]:duration-300 [&>div]:focus-within:shadow-[var(--shadow-composer-focus)]",
          isDragActive &&
            "[&>div]:ring-2 [&>div]:ring-primary/40 [&>div]:bg-primary/5"
        )}
        onDragLeave={() => setIsDragActive(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDrop={async (event) => {
          event.preventDefault();
          setIsDragActive(false);
          const droppedFiles = Array.from(event.dataTransfer.files || []);
          await processFiles(droppedFiles);
        }}
        onSubmit={() => {
          if (input.startsWith("/")) {
            const query = input.slice(1).trim();
            const cmd = availableSlashCommands.find((c) => c.name === query);
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
        {isDragActive && (
          <div className="mx-3 mb-2 rounded-xl border border-dashed border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
            Déposez vos fichiers ici (PDF, TXT, MD, JSON, CSV, images...)
          </div>
        )}
        {(isGhostModeArmed || isGhostConversation) && (
          <div className="mx-3 mb-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/10 px-2.5 py-1 text-[10px] font-medium text-violet-700 dark:text-violet-200">
            <Ghost className="size-3.5" />
            {isGhostModeArmed
              ? "Mode Fantôme activé : prochain message privé"
              : "Conversation Fantôme : historique désactivé"}
          </div>
        )}
        <PromptInputTextarea
          className={cn(
            "text-[13px] leading-relaxed placeholder:text-muted-foreground/35 sm:text-[13px]",
            chatBarSize === "compact" &&
              "min-h-24 px-3 pt-2.5 pb-1.5 sm:min-h-20 sm:px-3.5",
            chatBarSize === "standard" &&
              "min-h-28 px-3.5 pt-3 pb-1.5 sm:min-h-24 sm:px-4",
            chatBarSize === "large" &&
              "min-h-32 px-4 pt-3.5 pb-2 sm:min-h-28 sm:px-4.5"
          )}
          data-testid="multimodal-input"
          onChange={handleInput}
          onKeyDown={(e) => {
            if (slashOpen) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSlashIndex((i) =>
                  Math.min(i + 1, filteredSlashCommands.length - 1)
                );
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSlashIndex((i) => Math.max(i - 1, 0));
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                if (filteredSlashCommands[slashIndex]) {
                  handleSlashSelect(filteredSlashCommands[slashIndex]);
                }
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setSlashOpen(false);
                return;
              }
            }
            if (projectMentionOpen) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setProjectMentionIndex((index) =>
                  Math.min(index + 1, mentionItems.length - 1)
                );
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setProjectMentionIndex((index) => Math.max(index - 1, 0));
                return;
              }
              if (
                (e.key === "Enter" || e.key === "Tab") &&
                mentionItems.length > 0
              ) {
                e.preventDefault();
                const selectedMention = mentionItems[projectMentionIndex];
                if (selectedMention) {
                  handleMentionSelect(selectedMention);
                }
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
        {projectMentionOpen && (
          <div className="mx-3 mb-2 rounded-xl border border-border/60 bg-background/90 p-2 shadow-lg backdrop-blur-xl">
            {mentionItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun projet/plugin/interpréteur trouvé pour cette mention.
              </p>
            ) : (
              <div className="space-y-1">
                {mentionItems.slice(0, 8).map((item, index) => (
                  <button
                    className={cn(
                      "flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs transition",
                      index === projectMentionIndex
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-muted"
                    )}
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleMentionSelect(item)}
                    type="button"
                  >
                    <span>{item.label}</span>
                    {"description" in item && (
                      <span className="ml-2 text-[10px] text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <PromptInputFooter className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <PromptInputTools>
              <ContextualActionsMenu
                fileInputRef={fileInputRef}
                hasVision={true}
                onInsertTemplate={handleInsertTemplate}
                setAttachments={setAttachments}
                status={status}
              />
              <ModelSelectorCompact
                onModelChange={onModelChange}
                selectedModelId={selectedModelId}
              />
            </PromptInputTools>
            {showWordCounter ? (
              <p className="text-[10px] text-muted-foreground">
                {liveWordCount} mots · {liveCharacterCount} caractères · Entrée
                envoyer · Ctrl+N nouvelle discussion · Ctrl+/ sidebar
              </p>
            ) : null}
          </div>

          {status === "submitted" ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <div className="flex items-center gap-1">
              <Button
                aria-label={isRecording ? "Stop dictation" : "Start dictation"}
                className="h-7 w-7 rounded-full transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  handleToggleRecording();
                }}
                title="Dictée vocale"
                variant={isRecording ? "destructive" : "ghost"}
              >
                {isRecording ? (
                  <Square className="size-4" />
                ) : (
                  <MicIcon className="size-4 text-muted-foreground hover:text-foreground" />
                )}
              </Button>
              <PromptInputSubmit
                className={cn(
                  "h-7 w-7 rounded-xl transition-all duration-200",
                  input.trim() || attachments.length > 0
                    ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                    : "bg-muted text-muted-foreground/25 cursor-not-allowed"
                )}
                data-testid="send-button"
                disabled={
                  (!input.trim() && attachments.length === 0) ||
                  uploadQueue.length > 0
                }
                status={status}
                variant="secondary"
              >
                <ArrowUpIcon className="size-4" />
              </PromptInputSubmit>
            </div>
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
  setAttachments,
  onInsertTemplate,
  status,
  hasVision,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  onInsertTemplate: (templateText: string) => void;
  status: UseChatHelpers<ChatMessage>["status"];
  hasVision: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<
    "all" | "favorites" | "pinned"
  >("all");
  const [libraryAssets, setLibraryAssets] = useState<
    Array<{
      id: string;
      name: string;
      type: "image" | "document";
      pinned: boolean;
      favorite: boolean;
      url: string;
      createdAt: string;
    }>
  >([]);

  // States to hold the toggled options (to pass to chat logic later)
  // For the moment, we just expose them or keep them in sync with local storage/context
  const [isReasoningEnabled] = useLocalStorage("mai-reasoning-enabled", false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useLocalStorage(
    "mai-websearch-enabled",
    false
  );
  const [forceWebSearchEnabled, setForceWebSearchEnabled] = useLocalStorage(
    "mai-websearch-force-enabled",
    false
  );
  const [isLearningEnabled, setIsLearningEnabled] = useLocalStorage(
    "mai-learning-enabled",
    false
  );
  const [isImageCreationModeEnabled, setIsImageCreationModeEnabled] =
    useLocalStorage(IMAGE_CREATION_MODE_STORAGE_KEY, false);
  const [isMusicCreationModeEnabled, setIsMusicCreationModeEnabled] =
    useLocalStorage(MUSIC_CREATION_MODE_STORAGE_KEY, false);
  const [selectedPlugin, setSelectedPlugin] = useLocalStorage<string>(
    PLUGIN_MODE_STORAGE_KEY,
    "none"
  );
  const [enabledPluginIds, setEnabledPluginIds] = useLocalStorage<string[]>(
    PLUGIN_ENABLED_STORAGE_KEY,
    pluginRegistry
      .filter((plugin) => plugin.enabledByDefault)
      .map((plugin) => plugin.id)
  );
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isPluginPanelOpen, setIsPluginPanelOpen] = useState(false);
  const [pluginSearch, setPluginSearch] = useState("");
  const [pluginView, setPluginView] = useState<"all" | "favorites" | "pinned">(
    "all"
  );
  const [favoritePluginIds, setFavoritePluginIds] = useLocalStorage<string[]>(
    "mai.plugins.favorites.v1",
    []
  );
  const [pinnedPluginIds, setPinnedPluginIds] = useLocalStorage<string[]>(
    "mai.plugins.pinned.v1",
    []
  );
  const [quizDifficulty, setQuizDifficulty] = useState("moyen");
  const [reasoningLevel, setReasoningLevel] = useLocalStorage<ReflectionLevel>(
    "mai-reasoning-level",
    "medium"
  );
  const { plan, isHydrated } = useSubscriptionPlan();
  const [quizTopic, setQuizTopic] = useState("culture générale");
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [quizTimerMinutes, setQuizTimerMinutes] = useState(10);
  const selectedActions: string[] = [];
  const enabledPluginsSet = useMemo(
    () => new Set(enabledPluginIds),
    [enabledPluginIds]
  );
  const sortedPlugins = useMemo(
    () =>
      [...pluginRegistry].sort((left, right) =>
        left.name.localeCompare(right.name, "fr", { sensitivity: "base" })
      ),
    []
  );

  if (forceWebSearchEnabled) {
    selectedActions.push("Web forcée");
  } else if (isWebSearchEnabled) {
    selectedActions.push("Recherche");
  } else if (isLearningEnabled) {
    selectedActions.push("Apprentissage");
  } else if (isImageCreationModeEnabled) {
    selectedActions.push("Création d'images");
  } else if (isMusicCreationModeEnabled) {
    selectedActions.push("Créer de la musique");
  } else if (selectedPlugin !== "none") {
    const pluginLabel =
      pluginRegistry.find((plugin) => plugin.id === selectedPlugin)?.name ??
      selectedPlugin;
    selectedActions.push(`Plugin: ${pluginLabel}`);
  }

  const resetPlusModes = () => {
    setIsWebSearchEnabled(false);
    setForceWebSearchEnabled(false);
    setIsLearningEnabled(false);
    setIsImageCreationModeEnabled(false);
    setIsMusicCreationModeEnabled(false);
    setSelectedPlugin("none");
  };

  const toggleSinglePlusMode = (
    mode: "web" | "web-force" | "learning" | "image" | "music"
  ) => {
    const isAlreadyEnabled =
      (mode === "web" && isWebSearchEnabled && !forceWebSearchEnabled) ||
      (mode === "web-force" && forceWebSearchEnabled) ||
      (mode === "learning" && isLearningEnabled) ||
      (mode === "image" && isImageCreationModeEnabled) ||
      (mode === "music" && isMusicCreationModeEnabled);

    if (isAlreadyEnabled) {
      resetPlusModes();
      return;
    }

    resetPlusModes();
    if (mode === "web") {
      setIsWebSearchEnabled(true);
      return;
    }
    if (mode === "web-force") {
      setIsWebSearchEnabled(true);
      setForceWebSearchEnabled(true);
      return;
    }
    if (mode === "learning") {
      setIsLearningEnabled(true);
      return;
    }
    if (mode === "image") {
      setIsImageCreationModeEnabled(true);
      return;
    }
    setIsMusicCreationModeEnabled(true);
  };

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (reasoningLevel === "high" && plan !== "max") {
      setReasoningLevel(plan === "pro" ? "medium" : "low");
      return;
    }

    if (reasoningLevel === "medium" && plan !== "pro" && plan !== "max") {
      setReasoningLevel("low");
    }
  }, [plan, reasoningLevel, setReasoningLevel, isHydrated]);

  useEffect(() => {
    if (!isLibraryDialogOpen) {
      return;
    }
    const raw = localStorage.getItem("mai.library.assets");
    if (!raw) {
      setLibraryAssets([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLibraryAssets(parsed);
      }
    } catch {
      setLibraryAssets([]);
    }
  }, [isLibraryDialogOpen]);

  useEffect(() => {
    if (selectedPlugin !== "none" && !enabledPluginsSet.has(selectedPlugin)) {
      setSelectedPlugin("none");
    }
  }, [enabledPluginsSet, selectedPlugin, setSelectedPlugin]);

  useEffect(() => {
    if (enabledPluginIds.length === 0) {
      setEnabledPluginIds(
        pluginRegistry
          .filter((plugin) => plugin.enabledByDefault)
          .map((plugin) => plugin.id)
      );
    }
  }, [enabledPluginIds, setEnabledPluginIds]);

  const filteredLibraryAssets = libraryAssets
    .filter((asset) =>
      asset.name.toLowerCase().includes(librarySearch.trim().toLowerCase())
    )
    .filter((asset) => {
      if (libraryFilter === "favorites") {
        return asset.favorite;
      }
      if (libraryFilter === "pinned") {
        return asset.pinned;
      }
      return true;
    })
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  const displayedPlugins = sortedPlugins
    .filter((plugin) => {
      const query = pluginSearch.trim().toLowerCase();
      if (!query) {
        return true;
      }
      const haystack =
        `${plugin.name} ${plugin.command} ${plugin.category} ${plugin.description}`.toLowerCase();
      return haystack.includes(query);
    })
    .filter((plugin) => {
      if (pluginView === "favorites") {
        return favoritePluginIds.includes(plugin.id);
      }
      if (pluginView === "pinned") {
        return pinnedPluginIds.includes(plugin.id);
      }
      return true;
    })
    .sort((a, b) => {
      const pinScore =
        Number(pinnedPluginIds.includes(b.id)) -
        Number(pinnedPluginIds.includes(a.id));
      if (pinScore !== 0) {
        return pinScore;
      }

      const favoriteScore =
        Number(favoritePluginIds.includes(b.id)) -
        Number(favoritePluginIds.includes(a.id));
      if (favoriteScore !== 0) {
        return favoriteScore;
      }

      return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    });

  const attachFromLibrary = (asset: {
    name: string;
    type: "image" | "document";
    url: string;
  }) => {
    const attachment: Attachment = {
      url: asset.url || `data:text/plain,${encodeURIComponent(asset.name)}`,
      name: asset.name,
      contentType: asset.type === "image" ? "image/*" : "text/plain",
    };

    setAttachments((current) => {
      if (current.some((item) => item.url === attachment.url)) {
        return current;
      }
      return [...current, attachment];
    });

    setIsLibraryDialogOpen(false);
    setOpen(false);
    toast.success("Fichier ajouté depuis la bibliothèque.");
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <div className="flex items-center gap-1.5">
        <PopoverTrigger asChild>
          <Button
            aria-label="Contextual actions"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/40 bg-secondary/50 p-1 text-foreground shadow-sm transition-colors hover:bg-secondary"
            data-testid="context-actions-button"
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
        className="liquid-panel flex w-[min(88vw,19rem)] flex-col gap-1 rounded-2xl border-white/35 bg-white/88 p-2 text-black shadow-[var(--glass-shadow)] backdrop-blur-2xl"
        sideOffset={8}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="flex h-8 w-full items-center justify-start gap-2 text-xs font-normal"
              variant="ghost"
            >
              <Paperclip className="text-muted-foreground" size={16} />
              Ajouter photos/fichiers
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => {
                if (hasVision) {
                  fileInputRef.current?.click();
                } else {
                  toast.error("Le modèle actuel ne supporte pas les images");
                }
                setOpen(false);
              }}
            >
              Depuis l'appareil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setIsLibraryDialogOpen(true);
              }}
            >
              Depuis la bibliothèque
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-[1px] bg-border my-1 mx-2" />

        <Button
          className={cn(
            "flex h-8 w-full items-center justify-start gap-2 text-xs font-normal",
            isWebSearchEnabled &&
              "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          )}
          onClick={() => toggleSinglePlusMode("web")}
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
        <Button
          className={cn(
            "flex h-8 w-full items-center justify-start gap-2 text-xs font-normal",
            forceWebSearchEnabled &&
              "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          )}
          onClick={() => toggleSinglePlusMode("web-force")}
          variant="ghost"
        >
          <Globe2Icon
            className={
              forceWebSearchEnabled ? "text-primary" : "text-muted-foreground"
            }
            size={16}
          />
          Recherche sur le web
        </Button>

        <Button
          className={cn(
            "flex h-8 w-full items-center justify-start gap-2 text-xs font-normal",
            isImageCreationModeEnabled &&
              "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          )}
          onClick={() => toggleSinglePlusMode("image")}
          variant="ghost"
        >
          <ImageIcon
            className={
              isImageCreationModeEnabled
                ? "text-primary"
                : "text-muted-foreground"
            }
            size={16}
          />
          Création d'images
        </Button>
        <Button
          className={cn(
            "flex h-8 w-full items-center justify-start gap-2 text-xs font-normal",
            isMusicCreationModeEnabled &&
              "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          )}
          onClick={() => toggleSinglePlusMode("music")}
          variant="ghost"
        >
          <Music2Icon
            className={
              isMusicCreationModeEnabled
                ? "text-primary"
                : "text-muted-foreground"
            }
            size={16}
          />
          Créer de la musique
        </Button>

        <Button
          className="flex h-8 w-full items-center justify-start gap-2 text-xs font-normal"
          onClick={() => {
            setIsQuizDialogOpen(true);
            setOpen(false);
          }}
          variant="ghost"
        >
          <CircleHelpIcon className="text-muted-foreground" size={16} />
          Quiz
        </Button>

        <Button
          className="flex h-8 w-full items-center justify-start gap-2 text-xs font-normal"
          onClick={() => {
            onInsertTemplate("Ouvre un canevas structuré pour ce travail.");
            setOpen(false);
          }}
          variant="ghost"
        >
          <FilePenLineIcon className="text-muted-foreground" size={16} />
          Canevas
        </Button>

        <Button
          className={cn(
            "flex h-8 w-full items-center justify-start gap-2 text-xs font-normal",
            isLearningEnabled &&
              "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          )}
          onClick={() => toggleSinglePlusMode("learning")}
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

        <Button
          className="flex h-8 w-full items-center justify-between gap-2 text-xs font-normal"
          onClick={() => {
            setIsPluginPanelOpen(true);
            setOpen(false);
          }}
          variant="ghost"
        >
          <span className="inline-flex items-center gap-2">
            <Puzzle className="text-muted-foreground" size={16} />
            Plugins
          </span>
          <SearchIcon className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverContent>
      <Dialog onOpenChange={setIsPluginPanelOpen} open={isPluginPanelOpen}>
        <DialogContent className="liquid-panel max-w-3xl border-white/30 bg-white/85 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Puzzle className="size-4" />
              Plugins
            </DialogTitle>
            <DialogDescription>
              Fenêtre contextuelle : recherchez, épinglez et ajoutez des favoris
              pour accélérer l’usage des fonctionnalités.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                className="h-9 w-full rounded-lg border border-border/60 bg-background/70 px-3 text-sm"
                onChange={(event) => setPluginSearch(event.target.value)}
                placeholder="Rechercher un plugin, commande ou catégorie..."
                value={pluginSearch}
              />
              <select
                className="h-9 rounded-lg border border-border/60 bg-background/70 px-2 text-xs"
                onChange={(event) =>
                  setPluginView(
                    event.target.value as "all" | "favorites" | "pinned"
                  )
                }
                value={pluginView}
              >
                <option value="all">Tous</option>
                <option value="favorites">Favoris</option>
                <option value="pinned">Épinglés</option>
              </select>
            </div>
            <div className="max-h-[52dvh] space-y-2 overflow-y-auto pr-1">
              <button
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-left text-xs transition",
                  selectedPlugin === "none"
                    ? "border-primary/45 bg-primary/10 text-primary"
                    : "border-border/60 hover:border-primary/35 hover:bg-primary/5"
                )}
                      onClick={() => {
                        resetPlusModes();
                      }}
                type="button"
              >
                Aucun plugin actif
              </button>
              {displayedPlugins.map((plugin) => (
                <article
                  className="liquid-panel rounded-xl border border-border/60 bg-background/60 p-3"
                  key={plugin.id}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">
                      {plugin.name}
                      {plugin.isNew ? (
                        <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
                          <SparklesIcon className="size-2.5" />
                          NEW
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {plugin.description}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground/75">
                      {plugin.command} · {plugin.category}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-[11px] transition",
                        selectedPlugin === plugin.id
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/60 hover:border-primary/35"
                      )}
                      disabled={!enabledPluginsSet.has(plugin.id)}
                      onClick={() => {
                        if (selectedPlugin === plugin.id) {
                          resetPlusModes();
                          return;
                        }
                        resetPlusModes();
                        setSelectedPlugin(plugin.id);
                      }}
                      type="button"
                    >
                      Utiliser
                    </button>
                    <button
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-[11px] transition",
                        enabledPluginsSet.has(plugin.id)
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/60 hover:border-primary/35"
                      )}
                      onClick={() =>
                        setEnabledPluginIds((current) =>
                          current.includes(plugin.id)
                            ? current.filter((id) => id !== plugin.id)
                            : [...current, plugin.id]
                        )
                      }
                      type="button"
                    >
                      {enabledPluginsSet.has(plugin.id)
                        ? "Désactiver"
                        : "Activer"}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition",
                        favoritePluginIds.includes(plugin.id)
                          ? "border-primary/45 bg-primary/10 text-primary"
                          : "border-border/60"
                      )}
                      onClick={() =>
                        setFavoritePluginIds((current) =>
                          current.includes(plugin.id)
                            ? current.filter((id) => id !== plugin.id)
                            : [...current, plugin.id]
                        )
                      }
                      type="button"
                    >
                      <StarIcon className="size-3" />
                      Favori
                    </button>
                    <button
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition",
                        pinnedPluginIds.includes(plugin.id)
                          ? "border-primary/45 bg-primary/10 text-primary"
                          : "border-border/60"
                      )}
                      onClick={() =>
                        setPinnedPluginIds((current) =>
                          current.includes(plugin.id)
                            ? current.filter((id) => id !== plugin.id)
                            : [...current, plugin.id]
                        )
                      }
                      type="button"
                    >
                      <PinIcon className="size-3" />
                      Épingler
                    </button>
                  </div>
                </article>
              ))}
              {displayedPlugins.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                  Aucun plugin ne correspond à cette recherche/filtre.
                </p>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog onOpenChange={setIsLibraryDialogOpen} open={isLibraryDialogOpen}>
        <DialogContent className="liquid-panel max-w-2xl border-white/30 bg-white/85 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Bibliothèque</DialogTitle>
            <DialogDescription>
              Ajout rapide sans réimporter dans la bibliothèque.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                className="h-9 w-full rounded-lg border border-border/60 bg-background/70 px-3 text-sm"
                onChange={(event) => setLibrarySearch(event.target.value)}
                placeholder="Rechercher un fichier..."
                value={librarySearch}
              />
              <select
                className="h-9 rounded-lg border border-border/60 bg-background/70 px-2 text-xs"
                onChange={(event) =>
                  setLibraryFilter(
                    event.target.value as "all" | "favorites" | "pinned"
                  )
                }
                value={libraryFilter}
              >
                <option value="all">Tous</option>
                <option value="favorites">Favoris</option>
                <option value="pinned">Épinglés</option>
              </select>
            </div>
            <div className="grid max-h-80 grid-cols-2 gap-2 overflow-auto pr-1">
              {filteredLibraryAssets.map((asset) => (
                <button
                  className="liquid-panel rounded-xl border border-border/60 bg-background/65 p-2 text-left text-xs hover:border-primary/40"
                  key={asset.id}
                  onClick={() => attachFromLibrary(asset)}
                  type="button"
                >
                  <p className="truncate font-medium">{asset.name}</p>
                  <p className="text-muted-foreground">
                    {asset.favorite ? "★ Favori" : "☆"}{" "}
                    {asset.pinned ? "• 📌" : ""}
                  </p>
                </button>
              ))}
              {filteredLibraryAssets.length === 0 ? (
                <p className="col-span-2 rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                  Aucun fichier disponible.
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsLibraryDialogOpen(false)}
              variant="ghost"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog onOpenChange={setIsQuizDialogOpen} open={isQuizDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurer le quiz</DialogTitle>
            <DialogDescription>
              Renseignez le sujet, le nombre de questions et la difficulté avant
              génération.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Sujet</span>
              <input
                className="h-9 rounded-md border border-border/50 bg-background px-3 text-sm outline-none"
                onChange={(event) => setQuizTopic(event.target.value)}
                placeholder="ex. culture générale"
                value={quizTopic}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Questions</span>
              <input
                className="h-9 rounded-md border border-border/50 bg-background px-3 text-sm outline-none"
                max={30}
                min={2}
                onChange={(event) => {
                  const parsedValue = Number.parseInt(event.target.value, 10);
                  setQuizQuestionCount(
                    Number.isNaN(parsedValue)
                      ? 5
                      : Math.min(30, Math.max(2, parsedValue))
                  );
                }}
                type="number"
                value={quizQuestionCount}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Minuteur (minutes)</span>
              <input
                className="h-9 rounded-md border border-border/50 bg-background px-3 text-sm outline-none"
                max={120}
                min={1}
                onChange={(event) => {
                  const parsedValue = Number.parseInt(event.target.value, 10);
                  setQuizTimerMinutes(
                    Number.isNaN(parsedValue)
                      ? 10
                      : Math.min(120, Math.max(1, parsedValue))
                  );
                }}
                type="number"
                value={quizTimerMinutes}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Difficulté</span>
              <select
                className="h-9 rounded-md border border-border/50 bg-background px-3 text-sm outline-none"
                onChange={(event) => setQuizDifficulty(event.target.value)}
                value={quizDifficulty}
              >
                <option value="facile">Facile</option>
                <option value="moyen">Moyen</option>
                <option value="difficile">Difficile</option>
                <option value="expert">Expert</option>
              </select>
            </label>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsQuizDialogOpen(false)} variant="ghost">
              Annuler
            </Button>
            <Button
              onClick={() => {
                const params = new URLSearchParams({
                  topic: quizTopic.trim() || "culture générale",
                  difficulty: quizDifficulty,
                  count: String(quizQuestionCount),
                  timer: String(quizTimerMinutes),
                });
                window.location.assign(
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/quiz?${params.toString()}`
                );
                setIsQuizDialogOpen(false);
              }}
            >
              Générer le quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const { plan } = useSubscriptionPlan();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { data: modelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 }
  );

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
          <ModelSelectorLogo
            provider={resolveModelLogoProvider(selectedModel)}
          />
          <ModelSelectorName>{selectedModel.name}</ModelSelectorName>
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorInput placeholder="Rechercher un modèle texte..." />
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
              "cloudflare-workers-ai": "Cloudflare Workers AI",
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
              sambanova: "SambaNova",
              xiaomi: "Xiaomi",
              voyage: "Voyage",
              xai: "xAI",
              zai: "Zai",
            };

            return (
              <>
                {sortedKeys.map((key) => (
                  <ModelSelectorGroup
                    heading={
                      key === "_curated"
                        ? undefined
                        : (providerNames[key] ?? key)
                    }
                    key={key}
                  >
                    {[...grouped[key]]
                      .sort((left, right) =>
                        left.model.name.localeCompare(right.model.name, "fr", {
                          sensitivity: "base",
                        })
                      )
                      .map(({ model, curated }) => {
                        const logoProvider = resolveModelLogoProvider(model);
                        const tier = getTierForModelId(model.id);
                        const tierState = getTierRemaining(
                          tier,
                          plan,
                          isAuthenticated
                        );
                        const isExhausted = tierState.remaining <= 0;
                        return (
                          <ModelSelectorItem
                            className={cn(
                              "flex w-full",
                              model.id === selectedModel.id && "bg-muted/50",
                              (!curated || isExhausted) &&
                                "cursor-not-allowed opacity-40"
                            )}
                            disabled={!curated || isExhausted}
                            key={model.id}
                            onSelect={() => {
                              if (!curated) {
                                return;
                              }
                              if (isExhausted) {
                                const message = `${getTierLabel(tier)} épuisé : choisissez un modèle d'un tier inférieur.`;
                                toast.error(message);
                                createNotification({
                                  level: "warning",
                                  message,
                                  source: "system",
                                  title: "Crédits IA",
                                });
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
                              {!curated && (
                                <LockIcon className="size-3 text-muted-foreground/50" />
                              )}
                              {isExhausted && curated && (
                                <span className="rounded border border-border/50 px-1 py-0.5 text-[10px] text-muted-foreground">
                                  Quota épuisé
                                </span>
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
      aria-label="Stop generation"
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
