import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    .refine(
      (file) =>
        [
          "application/pdf",
          "text/plain",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/markdown",
          "text/csv",
          "application/json",
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "audio/mpeg",
          "audio/wav",
          "audio/webm",
        ].includes(file.type),
      {
        message:
          "File type should be PDF, TXT, DOCX, MD, CSV, JSON, JPEG, PNG, WEBP, GIF ou audio (MP3/WAV/WEBM)",
      }
    ),
  projectId: z.string().uuid().optional(),
});

const ProjectIdSchema = z.object({
  projectId: z.string().uuid().optional(),
});

function buildUploadPath({
  userId,
  projectId,
  filename,
}: {
  userId: string;
  projectId?: string;
  filename: string;
}) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const scope = projectId ? `projects/${projectId}` : "library";
  return `${userId}/${scope}/${Date.now()}-${safeName}`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const rawProjectId = formData.get("projectId");

    const parsedProject = ProjectIdSchema.safeParse({
      projectId:
        typeof rawProjectId === "string" && rawProjectId.trim().length > 0
          ? rawProjectId
          : undefined,
    });

    if (!parsedProject.success) {
      return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({
      file,
      projectId: parsedProject.data.projectId,
    });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();
    const pathname = buildUploadPath({
      userId: session.user.id,
      projectId: parsedProject.data.projectId,
      filename,
    });

    try {
      const data = await put(pathname, fileBuffer, {
        access: "public",
      });

      return NextResponse.json(data);
    } catch (error) {
      console.error("Upload failed:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
