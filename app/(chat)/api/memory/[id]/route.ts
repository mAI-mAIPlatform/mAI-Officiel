import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteMemoryEntryByUser,
  updateMemoryEntryByUser,
} from "@/lib/db/queries";

const updateMemorySchema = z.object({
  content: z.string().trim().min(1).max(2000),
  type: z.enum(["auto", "manual"]).optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateMemorySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  let updated;
  try {
    [updated] = await updateMemoryEntryByUser(id, session.user.id, {
      content: parsed.data.content,
      type: parsed.data.type,
      projectId: parsed.data.projectId ?? undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "memory_table_missing") {
      return NextResponse.json(
        {
          error:
            'La table "Memory" est absente. Appliquez les migrations base de données pour activer la mémoire serveur.',
        },
        { status: 503 }
      );
    }
    throw error;
  }

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let deleted;
  try {
    [deleted] = await deleteMemoryEntryByUser(id, session.user.id);
  } catch (error) {
    if (error instanceof Error && error.message === "memory_table_missing") {
      return NextResponse.json(
        {
          error:
            'La table "Memory" est absente. Appliquez les migrations base de données pour activer la mémoire serveur.',
        },
        { status: 503 }
      );
    }
    throw error;
  }

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
