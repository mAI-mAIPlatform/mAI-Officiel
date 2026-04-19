import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.enum(["image/jpeg", "image/png"]),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user"]),
  parts: z.array(partSchema),
});

const toolApprovalMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  parts: z.array(z.record(z.unknown())),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: userMessageSchema.optional(),
  messages: z.array(toolApprovalMessageSchema).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
  contextualActions: z
    .object({
      isReasoningEnabled: z.boolean().optional(),
      reasoningLevel: z
        .enum(["light", "moderate", "deep", "very-deep"])
        .optional(),
      isWebSearchEnabled: z.boolean().optional(),
      forceWebSearchEnabled: z.boolean().optional(),
      isLearningEnabled: z.boolean().optional(),
    })
    .optional(),
  ghostMode: z.boolean().optional(),
  uploadSource: z.enum(["device", "mai-library"]).optional(),
  persistentMemory: z.string().max(4000).optional(),
  customSystemPrompt: z.string().max(8000).optional(),
  clientGeolocation: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  projectId: z.string().uuid().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
