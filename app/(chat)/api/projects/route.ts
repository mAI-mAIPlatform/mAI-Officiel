import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createProject, getProjects } from "@/lib/db/queries";

const projectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(5000).optional(),
  instructions: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(30).optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  icon: z.string().trim().max(50).nullable().optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await getProjects(session.user.id);
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = projectSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [created] = await createProject({
    userId: session.user.id,
    name: parsed.data.name,
    description: parsed.data.description,
    instructions: parsed.data.instructions,
    tags: parsed.data.tags ?? [],
    color: parsed.data.color ?? null,
    icon: parsed.data.icon ?? null,
  });

  return NextResponse.json(created, { status: 201 });
}
