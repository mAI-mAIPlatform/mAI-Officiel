import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getNotificationsByUser,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from "@/lib/db/queries";

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const limit = parsed.data.limit ?? 50;
  const offset = parsed.data.offset ?? 0;

  const [items, unreadCount] = await Promise.all([
    getNotificationsByUser(session.user.id, limit, offset),
    getUnreadNotificationCount(session.user.id),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllNotificationsAsRead(session.user.id);
  return NextResponse.json({ success: true });
}
