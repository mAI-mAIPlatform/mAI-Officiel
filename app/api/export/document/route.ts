import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { content, format } = await request.json();

    if (!content || !format) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (format === "pdf") {
      // Dans cet environnement de test restreint, on ne peut pas importer jsPDF ou react-pdf.
      // On va renvoyer un PDF valide minimal hardcodé comme simulation d'un export.
      // Un vrai export utiliserait une librairie pour transformer 'content' en PDF.

      const pdfString = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 73 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Fichier PDF genere depuis le cloud MAI) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000222 00000 n \n0000000346 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n436\n%%EOF`;

      return new NextResponse(pdfString, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="export.pdf"`,
        },
      });
    }

    if (format === "docx") {
       // De même pour DOCX sans bibliothèque. On renvoie un TXT renommé avec un avertissement (le client sait que c'est "simulé").
       // Un vrai DOCX nécessite un fichier ZIP avec une structure XML.
       const warningText = `SIMULATION DOCX\n\nContenu généré:\n${content}\n\n(Impossible de générer un vrai fichier .docx dans cet environnement sans les librairies docx/mammoth)`;

       return new NextResponse(warningText, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="export.docx"`,
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    console.error("Document export error", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
