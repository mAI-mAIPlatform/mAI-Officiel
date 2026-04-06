import { NextResponse } from "next/server";
import {
  createStructuredReport,
  extractReadableTextFromHtml,
} from "@/lib/extensions/manalyse";

const decoder = new TextDecoder("utf-8", { fatal: false });

function fallbackBinaryToText(buffer: ArrayBuffer) {
  return decoder
    .decode(buffer)
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const sourceType = formData.get("sourceType")?.toString() || "url";

  let extractedText = "";
  const notes: string[] = [];

  if (sourceType === "url") {
    const targetUrl = formData.get("targetUrl")?.toString();

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Veuillez fournir une URL." },
        { status: 400 }
      );
    }

    const response = await fetch(targetUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Impossible de récupérer le contenu de l'URL." },
        { status: 400 }
      );
    }

    const html = await response.text();
    extractedText = extractReadableTextFromHtml(html);
    notes.push("Contenu web nettoyé (balises HTML supprimées). ");
  }

  if (sourceType !== "url") {
    const uploadedFile = formData.get("uploadedFile");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        { error: "Veuillez sélectionner un fichier valide." },
        { status: 400 }
      );
    }

    const fileBuffer = await uploadedFile.arrayBuffer();
    const mimeType = uploadedFile.type;
    const filename = uploadedFile.name.toLowerCase();

    if (mimeType.startsWith("text/") || filename.endsWith(".txt")) {
      extractedText = await uploadedFile.text();
      notes.push("Extraction texte brute réalisée depuis un fichier TXT.");
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      filename.endsWith(".docx")
    ) {
      extractedText = fallbackBinaryToText(fileBuffer);
      notes.push(
        "Extraction DOCX réalisée en mode compatible (texte brut récupéré depuis les flux binaires)."
      );
    } else if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
      extractedText = fallbackBinaryToText(fileBuffer);
      notes.push(
        "Extraction PDF réalisée en mode léger ; pour des scans complexes, privilégiez un OCR dédié."
      );
    } else if (mimeType.startsWith("image/")) {
      extractedText = `Image détectée: ${uploadedFile.name}. Aucun OCR natif local disponible dans cette version.`;
      notes.push(
        "OCR image: fallback descriptif activé. Ajoutez une transcription pour améliorer la précision."
      );
    } else {
      extractedText = fallbackBinaryToText(fileBuffer);
      notes.push(
        "Type de fichier non standard, extraction en texte brut appliquée."
      );
    }
  }

  const report = createStructuredReport(extractedText);

  return NextResponse.json({
    report,
    extractedText,
    notes,
  });
}
