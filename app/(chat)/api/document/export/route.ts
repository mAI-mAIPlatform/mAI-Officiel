import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getDocumentsById } from "@/lib/db/queries";
import {
  buildExportFileName,
  documentExportFormats,
  exportContentAsBuffer,
} from "@/lib/document-export";
import { ChatbotError } from "@/lib/errors";

const searchSchema = z.object({
  id: z.string().uuid(),
  format: z.enum(documentExportFormats),
});

const contentTypeByFormat = {
  doc: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:document").toResponse();
  }

  const { searchParams } = new URL(request.url);

  const parsed = searchSchema.safeParse({
    id: searchParams.get("id"),
    format: searchParams.get("format"),
  });

  if (!parsed.success) {
    return new ChatbotError(
      "bad_request:api",
      "Parameters id and format are required and must be valid."
    ).toResponse();
  }

  const { id, format } = parsed.data;
  const documents = await getDocumentsById({ id });
  const latestDocument = documents.at(-1);

  if (!latestDocument) {
    return new ChatbotError("not_found:document").toResponse();
  }

  if (latestDocument.userId !== session.user.id) {
    return new ChatbotError("forbidden:document").toResponse();
  }

  const data = await exportContentAsBuffer(
    latestDocument.title,
    latestDocument.content ?? "",
    format
  );

  const fileName = buildExportFileName(latestDocument.title, format);

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": contentTypeByFormat[format],
      "Content-Disposition": `attachment; filename=\"${fileName}\"`,
      "Cache-Control": "no-store",
    },
  });
}
