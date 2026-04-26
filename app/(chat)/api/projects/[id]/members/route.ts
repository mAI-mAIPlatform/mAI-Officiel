import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db, getProjectById } from "@/lib/db/queries";
import { eq } from "drizzle-orm";
import { user } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const project = await getProjectById(id);

  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [owner] = await db
    .select({ id: user.id, name: user.name, image: user.image, email: user.email })
    .from(user)
    .where(eq(user.id, session.user.id));

  return NextResponse.json(owner ? [owner] : []);
}
