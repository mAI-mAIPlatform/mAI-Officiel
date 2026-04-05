import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createTagForUser,
  deleteTagForUser,
  getTagCountByUserId,
  getTagsByUserId,
  updateTagForUser,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { parsePlanKey } from "@/lib/subscription";
import { isValidHexColor, normalizeTagName, tagLimitByPlan } from "@/lib/tags";

const createTagSchema = z.object({
  color: z.string().trim().default("#60a5fa"),
  name: z.string().trim().min(1).max(64),
});

const patchTagSchema = z.object({
  color: z.string().trim().optional(),
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(64).optional(),
});

const deleteTagSchema = z.object({
  id: z.string().uuid(),
});

function readPlanKey(request: Request) {
  const value = request.headers.get("x-plan-key");
  return parsePlanKey(value);
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const tags = await getTagsByUserId(session.user.id);
  return Response.json({ tags });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const parsedPayload = createTagSchema.safeParse(await request.json());
  if (!parsedPayload.success) {
    return new ChatbotError(
      "bad_request:api",
      "Payload de tag invalide"
    ).toResponse();
  }

  const planKey = readPlanKey(request);
  const maxTags = tagLimitByPlan[planKey];
  const currentCount = await getTagCountByUserId(session.user.id);

  if (currentCount >= maxTags) {
    return Response.json(
      {
        error: `Limite atteinte: ${maxTags} tags pour le plan ${planKey}.`,
      },
      { status: 409 }
    );
  }

  const name = normalizeTagName(parsedPayload.data.name);
  const color = parsedPayload.data.color;

  if (!isValidHexColor(color)) {
    return new ChatbotError(
      "bad_request:api",
      "Couleur HEX invalide"
    ).toResponse();
  }

  const createdTag = await createTagForUser({
    color,
    name,
    userId: session.user.id,
  });

  return Response.json({ tag: createdTag }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const parsedPayload = patchTagSchema.safeParse(await request.json());
  if (!parsedPayload.success) {
    return new ChatbotError(
      "bad_request:api",
      "Payload de tag invalide"
    ).toResponse();
  }

  const { id, name, color } = parsedPayload.data;

  if (color && !isValidHexColor(color)) {
    return new ChatbotError(
      "bad_request:api",
      "Couleur HEX invalide"
    ).toResponse();
  }

  const updatedTag = await updateTagForUser({
    color,
    id,
    name: name ? normalizeTagName(name) : undefined,
    userId: session.user.id,
  });

  if (!updatedTag) {
    return Response.json({ error: "Tag introuvable" }, { status: 404 });
  }

  return Response.json({ tag: updatedTag });
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const parsedPayload = deleteTagSchema.safeParse(await request.json());
  if (!parsedPayload.success) {
    return new ChatbotError(
      "bad_request:api",
      "Payload de suppression invalide"
    ).toResponse();
  }

  const deletedTag = await deleteTagForUser({
    id: parsedPayload.data.id,
    userId: session.user.id,
  });

  if (!deletedTag) {
    return Response.json({ error: "Tag introuvable" }, { status: 404 });
  }

  return Response.json({ success: true });
}
