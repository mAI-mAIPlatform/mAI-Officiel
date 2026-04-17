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
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { normalizePromptInput, validatePromptSafety } from "@/lib/ai/safety";
import {
  isExternalTextModel,
  runExternalTextModel,
} from "@/lib/ai/external-providers";
import {
  allowedModelIds,
  chatModels,
  DEFAULT_CHAT_MODEL,
  getCapabilities,
} from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
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
  saveChat,
  saveMessages,
  updateChatTitleById,
  upsertMessages,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import { checkIpRateLimit } from "@/lib/ratelimit";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;
const MAX_CHAT_TITLE_LENGTH = 160;

function normalizeChatTitle(title: string): string {
  return title.trim().slice(0, MAX_CHAT_TITLE_LENGTH);
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

    await checkIpRateLimit(ipAddress(request));

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 1,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerHour) {
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
      await saveChat({
        id,
        userId: session.user.id,
        title: "New chat",
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
    const modelCapabilities = await getCapabilities();
    const capabilities = modelCapabilities[chatModel];
    // Override reasoning based on contextual action
    const isReasoningModel =
      capabilities?.reasoning === true ||
      contextualActions?.isReasoningEnabled === true;
    const supportsTools = capabilities?.tools === true;
    const contextualReasoningEffortMap = {
      light: "minimal",
      moderate: "low",
      deep: "medium",
      "very-deep": "high",
    } as const;
    const contextualReasoningLevel =
      contextualActions?.reasoningLevel ?? "moderate";
    const contextualReasoningEffort =
      contextualReasoningEffortMap[contextualReasoningLevel];
    const openaiReasoningEffort =
      contextualActions?.isReasoningEnabled === true
        ? contextualReasoningEffort
        : modelConfig?.reasoningEffort;

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

    if (isExternalTextModel(chatModel)) {
      if (!sanitizedLatestUserText) {
        return new ChatbotError("bad_request:api").toResponse();
      }

      const externalResult = await runExternalTextModel(
        chatModel,
        modelMessages,
        {
          systemInstruction:
            'Reply in the same language as the user\'s latest message. For health topics, include the exact disclaimer: "mAIHealth ne remplace pas un professionnel de santé".',
        }
      );
      const assistantMessageId = generateUUID();
      const textPartId = generateUUID();

      if (!isGhostMode) {
        await saveMessages({
          messages: [
            {
              id: assistantMessageId,
              role: "assistant",
              parts: [{ type: "text", text: externalResult.text }],
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            },
          ],
        });
      }

      const stream = createUIMessageStream({
        execute: async ({ writer }) => {
          writer.write({ type: "text-start", id: textPartId });
          const chunks = externalResult.text.split(/(\s+)/).filter(Boolean);
          for (const chunk of chunks) {
            writer.write({
              type: "text-delta",
              id: textPartId,
              delta: chunk,
            });
            await new Promise((resolve) => setTimeout(resolve, 12));
          }
          writer.write({ type: "text-end", id: textPartId });

          if (titlePromise && !isGhostMode) {
            const title = normalizeChatTitle(await titlePromise);
            writer.write({ type: "data-chat-title", data: title });
            await updateChatTitleById({ chatId: id, title });
          }
        },
      });

      return createUIMessageStreamResponse({ stream });
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
    if (contextualActions?.isWebSearchEnabled || forceWebSearch) {
      activeTools.push("webSearch");
    }

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(chatModel),
          system: systemPrompt({
            requestHints,
            supportsTools,
            userMemory: persistentMemory,
            isLearningEnabled: contextualActions?.isLearningEnabled,
            reasoningLevel:
              contextualActions?.isReasoningEnabled === true
                ? contextualReasoningLevel
                : undefined,
          }).concat(
            forceWebSearch
              ? "\n\n[Instruction système] La recherche web est obligatoire pour cette requête: appelle d'abord l'outil webSearch, puis réponds en t'appuyant sur ses résultats."
              : ""
          ),
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            isReasoningModel && !supportsTools ? [] : activeTools,
          providerOptions: {
            ...(modelConfig?.gatewayOrder && {
              gateway: { order: modelConfig.gatewayOrder },
            }),
            ...(openaiReasoningEffort && {
              openai: { reasoningEffort: openaiReasoningEffort },
            }),
          },
          tools: {
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
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        dataStream.merge(
          result.toUIMessageStream({ sendReasoning: isReasoningModel })
        );

        if (titlePromise && !isGhostMode) {
          const title = normalizeChatTitle(await titlePromise);
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
        if (
          error instanceof Error &&
          error.message?.includes(
            "AI Gateway requires a valid credit card on file to service requests"
          )
        ) {
          return "AI Gateway requires a valid credit card on file to service requests. Please visit https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card to add a card and unlock your free credits.";
        }
        return "Oops, an error occurred!";
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

    console.error("Unhandled error in chat API:", error, { vercelId });
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
