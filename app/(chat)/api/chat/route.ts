import { geolocation, ipAddress } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
} from "ai";
import { checkBotId } from "botid/server";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth, type UserType } from "@/app/(auth)/auth";
import { getMaxMessagesPerHour } from "@/lib/ai/entitlements";
import {
  allowedModelIds,
  chatModels,
  DEFAULT_CHAT_MODEL,
  getCapabilities,
} from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { normalizePromptInput, validatePromptSafety } from "@/lib/ai/safety";
import { audioAssistant } from "@/lib/ai/tools/audio-assistant";
import { createDocument } from "@/lib/ai/tools/create-document";
import { createMaiTool } from "@/lib/ai/tools/create-mai";
import { createProjectTool } from "@/lib/ai/tools/create-project";
import { createProjectTaskTool } from "@/lib/ai/tools/create-project-task";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { followUpSuggestions } from "@/lib/ai/tools/follow-up-suggestions";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { textUtilities } from "@/lib/ai/tools/text-utilities";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { webSearch } from "@/lib/ai/tools/web-search";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getProjectById,
  getSubscriptionPlan,
  saveChat,
  saveMessages,
  updateChatTitleById,
  upsertMessages,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import { checkIpRateLimit } from "@/lib/ratelimit";
import { checkServerUsageLimit } from "@/lib/server-usage";
import { parsePlanKey, planDefinitions } from "@/lib/subscription";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;
const MAX_CHAT_TITLE_LENGTH = 160;

function normalizeChatTitle(title: string): string {
  return title.trim().slice(0, MAX_CHAT_TITLE_LENGTH);
}

function buildFallbackTitleFromMessage(message?: ChatMessage): string {
  const text = message?.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "Nouvelle discussion";
  }

  return normalizeChatTitle(text.split(" ").slice(0, 8).join(" "));
}

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      messages,
      selectedChatModel,
      selectedVisibilityType,
      contextualActions,
      ghostMode,
      persistentMemory,
      customSystemPrompt,
      clientGeolocation,
      projectId,
    } = requestBody;
    const isGhostMode = ghostMode === true;

    const [, session] = await Promise.all([
      checkBotId().catch(() => null),
      auth(),
    ]);

    if (!session?.user) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }

    const chatModel =
      selectedChatModel.startsWith("agent-") ||
      !allowedModelIds.has(selectedChatModel)
        ? DEFAULT_CHAT_MODEL
        : selectedChatModel;

    const dbPlanKey = await getSubscriptionPlan(session.user.id);
    const plan = parsePlanKey(dbPlanKey);
    const planMessageLimit = planDefinitions[plan].limits.messagesPerHour;
    await checkIpRateLimit(ipAddress(request), planMessageLimit);

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 1,
    });

    const maxMessagesPerHour = getMaxMessagesPerHour(userType, plan);

    if (messageCount > maxMessagesPerHour) {
      return new ChatbotError("rate_limit:chat").toResponse();
    }

    const isToolApprovalFlow = Boolean(messages);

    const chat = isGhostMode ? null : await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatbotError("forbidden:chat").toResponse();
      }
      messagesFromDb = await getMessagesByChatId({ id });
    } else if (message?.role === "user" && !isGhostMode) {
      if (projectId) {
        const selectedProject = await getProjectById(projectId);
        if (!selectedProject || selectedProject.userId !== session.user.id) {
          return new ChatbotError("forbidden:chat").toResponse();
        }
      }
      const provisionalTitle = buildFallbackTitleFromMessage(message as ChatMessage);
      await saveChat({
        id,
        userId: session.user.id,
        title: provisionalTitle,
        visibility: selectedVisibilityType,
        projectId,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    let uiMessages: ChatMessage[];

    if (isToolApprovalFlow && messages) {
      const dbMessages = convertToUIMessages(messagesFromDb);
      const approvalStates = new Map(
        messages.flatMap(
          (m) =>
            m.parts
              ?.filter(
                (p: Record<string, unknown>) =>
                  p.state === "approval-responded" ||
                  p.state === "output-denied"
              )
              .map((p: Record<string, unknown>) => [
                String(p.toolCallId ?? ""),
                p,
              ]) ?? []
        )
      );
      uiMessages = dbMessages.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (
            "toolCallId" in part &&
            approvalStates.has(String(part.toolCallId))
          ) {
            return { ...part, ...approvalStates.get(String(part.toolCallId)) };
          }
          return part;
        }),
      })) as ChatMessage[];
    } else {
      uiMessages = [
        ...convertToUIMessages(messagesFromDb),
        message as ChatMessage,
      ];
    }

    let { longitude, latitude, city, country } = geolocation(request);

    if (clientGeolocation) {
      longitude = String(clientGeolocation.longitude);
      latitude = String(clientGeolocation.latitude);
    }

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (message?.role === "user" && !isGhostMode) {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const modelConfig = chatModels.find((m) => m.id === chatModel);
    const isHordeTextModel = chatModel.startsWith("horde/");
    const modelCapabilities = await getCapabilities();
    const capabilities = modelCapabilities[chatModel];
    // Override reasoning based on contextual action
    const isReasoningModel =
      capabilities?.reasoning === true ||
      contextualActions?.isReasoningEnabled === true;
    const supportsTools = capabilities?.tools === true;
    const contextualReasoningEffortMap = {
      none: "none",
      low: "low",
      medium: "medium",
      high: "high",
    } as const;
    const contextualReasoningLevel =
      contextualActions?.reasoningLevel ?? "medium";
    const contextualReasoningEffort =
      contextualReasoningEffortMap[contextualReasoningLevel];
    const openaiReasoningEffort =
      contextualActions?.isReasoningEnabled === true
        ? contextualReasoningEffort
        : modelConfig?.reasoningEffort;

    const computedSystemPrompt = systemPrompt({
      requestHints,
      supportsTools,
      agentPrompt: customSystemPrompt,
      userMemory: persistentMemory,
      isLearningEnabled: contextualActions?.isLearningEnabled,
      reasoningLevel:
        contextualActions?.isReasoningEnabled === true
          ? contextualReasoningLevel
          : undefined,
    });

    const modelMessages = await convertToModelMessages(uiMessages);
    const latestUserText =
      message?.parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n")
        .trim() ?? "";

    const sanitizedLatestUserText = normalizePromptInput(latestUserText);
    const safety = validatePromptSafety(sanitizedLatestUserText);

    if (safety.blocked) {
      return Response.json(
        {
          error:
            "Votre requête a été bloquée par les garde-fous de sécurité (contenu sensible, dangereux ou incohérent).",
        },
        { status: 400 }
      );
    }

    // Base tools available
    const activeTools: (
      | "getWeather"
      | "createDocument"
      | "editDocument"
      | "updateDocument"
      | "requestSuggestions"
      | "followUpSuggestions"
      | "createProjectTask"
      | "createProject"
      | "createMai"
      | "audioAssistant"
      | "textUtilities"
      | "webSearch"
    )[] = [
      "getWeather",
      "createDocument",
      "editDocument",
      "updateDocument",
      "requestSuggestions",
      "followUpSuggestions",
      "createProjectTask",
      "createProject",
      "createMai",
      "audioAssistant",
      "textUtilities",
    ];

    const forceWebSearch = contextualActions?.forceWebSearchEnabled === true;

    // Add web search tool if contextual action is enabled

    const canWebSearch = await checkServerUsageLimit(
      session.user.id,
      "websearch",
      "day",
      planDefinitions[plan].limits.webSearchesPerDay
    );

    if (
      (contextualActions?.isWebSearchEnabled || forceWebSearch) &&
      canWebSearch
    ) {
      activeTools.push("webSearch");
    }

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(chatModel),
          system: computedSystemPrompt.concat(
            forceWebSearch
              ? "\n\n[Instruction système] La recherche web est obligatoire pour cette requête: appelle d'abord l'outil webSearch, puis réponds en t'appuyant sur ses résultats."
              : ""
          ),
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            isReasoningModel && !supportsTools
              ? []
              : isHordeTextModel
                ? []
                : activeTools,
          providerOptions: {
            ...(!isHordeTextModel &&
              openaiReasoningEffort && {
              openai: { reasoningEffort: openaiReasoningEffort },
            }),
          },
          tools: isHordeTextModel
            ? {}
            : {
                getWeather,
                createDocument: createDocument({
                  session,
                  dataStream,
                  modelId: chatModel,
                }),
                editDocument: editDocument({ dataStream, session }),
                updateDocument: updateDocument({
                  session,
                  dataStream,
                  modelId: chatModel,
                }),
                requestSuggestions: requestSuggestions({
                  session,
                  dataStream,
                  modelId: chatModel,
                }),
                followUpSuggestions,
                createProjectTask: createProjectTaskTool(session.user.id),
                createProject: createProjectTool(session.user.id),
                createMai: createMaiTool(session.user.id),
                audioAssistant,
                textUtilities,
                webSearch,
              },
          toolChoice: isHordeTextModel ? "none" : "auto",
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        dataStream.merge(
          result.toUIMessageStream({ sendReasoning: isReasoningModel })
        );

        if (titlePromise && !isGhostMode) {
          const generatedTitle = normalizeChatTitle(await titlePromise);
          const title =
            generatedTitle.length > 0
              ? generatedTitle
              : buildFallbackTitleFromMessage(message as ChatMessage);
          dataStream.write({ type: "data-chat-title", data: title });
          await updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isGhostMode) {
          return;
        }

        if (isToolApprovalFlow) {
          if (finishedMessages.length > 0) {
            await upsertMessages({
              messages: finishedMessages.map((finishedMsg) => ({
                id: finishedMsg.id,
                role: finishedMsg.role,
                parts: finishedMsg.parts,
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              })),
            });
          }
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : "Unknown streaming error";

        console.error("[mAI Chat Error] streamText failed", {
          model: chatModel,
          message,
          stack: error instanceof Error ? error.stack : undefined,
        });

        if (
          message.includes(
            "AI Gateway requires a valid credit card on file to service requests"
          )
        ) {
          return "AI Gateway requires a valid credit card on file to service requests. Please visit https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card to add a card and unlock your free credits.";
        }

        if (message.toLowerCase().includes("api key")) {
          return "Clé API manquante ou invalide. Vérifie FS_API_KEY.";
        }

        if (message.toLowerCase().includes("model")) {
          return `Modèle "${chatModel}" non reconnu par le provider.`;
        }

        if (message.toLowerCase().includes("not found")) {
          return `Le provider IA n'expose pas encore l'endpoint/modèle demandé pour "${chatModel}". Essaie "openai/gpt-5" ou "openai/gpt-5-mini".`;
        }

        if (message.toLowerCase().includes("bad request")) {
          return `Le provider IA a rejeté la requête pour "${chatModel}" (agent inactif ou modèle indisponible). Essaie "openai/gpt-5.4" ou "openai/gpt-5.4-mini".`;
        }

        return "Une erreur est survenue. Réessaie ou change de modèle.";
      },
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch (_) {
          /* non-critical */
        }
      },
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatbotError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatbotError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, {
      vercelId,
      chatModel: requestBody?.selectedChatModel,
    });
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (!chat) {
    return new ChatbotError("not_found:chat").toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const { id, title } = (await request.json()) as {
      id?: string;
      title?: string;
    };

    const trimmedTitle = title?.trim();

    if (!id || !trimmedTitle) {
      return new ChatbotError("bad_request:api").toResponse();
    }

    if (trimmedTitle.length > MAX_CHAT_TITLE_LENGTH) {
      return new ChatbotError("bad_request:api").toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat || chat.userId !== session.user.id) {
      return new ChatbotError("forbidden:chat").toResponse();
    }

    await updateChatTitleById({
      chatId: id,
      title: normalizeChatTitle(trimmedTitle),
    });

    return Response.json(
      { id, title: normalizeChatTitle(trimmedTitle) },
      { status: 200 }
    );
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }
}
