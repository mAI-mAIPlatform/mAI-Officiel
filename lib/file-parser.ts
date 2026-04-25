export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export const SUPPORTED_FILE_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type ParsedFileResult = {
  extractedText: string;
  mediaType: string;
};

export async function parseFileForAi(file: File): Promise<ParsedFileResult> {
  const mediaType = file.type || "application/octet-stream";

  if (mediaType.startsWith("text/") || mediaType === "application/json") {
    const text = await file.text();
    return {
      extractedText: text.slice(0, 20_000),
      mediaType,
    };
  }

  if (mediaType === "application/pdf") {
    return {
      extractedText: `[PDF importé: ${file.name}]\nLe texte complet du PDF n'est pas extrait localement.`,
      mediaType,
    };
  }

  if (
    mediaType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({
        arrayBuffer,
      });
      return {
        extractedText: value.slice(0, 20_000),
        mediaType,
      };
    } catch {
      return {
        extractedText: `[DOCX importé: ${file.name}]\nExtraction locale indisponible.`,
        mediaType,
      };
    }
  }

  if (
    mediaType ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    try {
      const xlsx = await import("xlsx");
      const arrayBuffer = await file.arrayBuffer();
      const workbook = xlsx.read(arrayBuffer, { type: "array" });
      const mergedText = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const csv = xlsx.utils.sheet_to_csv(worksheet);
        return `### Feuille: ${sheetName}\n${csv}`;
      }).join("\n\n");
      return {
        extractedText: mergedText.slice(0, 20_000),
        mediaType,
      };
    } catch {
      return {
        extractedText: `[XLSX importé: ${file.name}]\nExtraction locale indisponible.`,
        mediaType,
      };
    }
  }

  return {
    extractedText: "",
    mediaType,
  };
}

export function validateFileBeforeUpload(file: File): string | null {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `Le fichier "${file.name}" dépasse la limite de 5MB.`;
  }

  if (
    !SUPPORTED_FILE_TYPES.has(file.type) &&
    file.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return `Format non supporté: ${file.name} (${file.type || "inconnu"}).`;
  }

  return null;
}
