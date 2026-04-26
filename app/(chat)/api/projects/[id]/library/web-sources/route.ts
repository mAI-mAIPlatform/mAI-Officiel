import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createProjectWebSource,
  getProjectById,
  getProjectWebSources,
} from "@/lib/db/queries";

const schema = z.object({
  url: z.string().url(),
});

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return match?.[1]?.trim() || "Source Web";
}

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

  const sources = await getProjectWebSources(id);
  return NextResponse.json(sources);
}

export async function POST(
  request: Request,
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

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const fetched = await fetch(parsed.data.url).catch(() => null);
  const html = fetched?.ok ? await fetched.text() : "";
  const title = extractTitle(html);
  const hostname = new URL(parsed.data.url).hostname;

  const [created] = await createProjectWebSource({
    projectId: id,
    userId: session.user.id,
    url: parsed.data.url,
    title,
    description: null,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
  });

  return NextResponse.json(created, { status: 201 });
}
