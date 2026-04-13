import { Document, Packer, Paragraph, TextRun } from "docx";
import PptxGenJS from "pptxgenjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { utils, write } from "xlsx";

export const documentExportFormats = ["doc", "pdf", "pptx", "xlsx"] as const;
export type DocumentExportFormat = (typeof documentExportFormats)[number];

const sanitizeLines = (content: string) =>
  content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd());

export async function exportContentAsBuffer(
  title: string,
  content: string,
  format: DocumentExportFormat
): Promise<Buffer> {
  switch (format) {
    case "doc": {
      const lines = sanitizeLines(content);
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                heading: "Heading1",
                children: [new TextRun({ text: title, bold: true })],
              }),
              ...lines.map(
                (line) =>
                  new Paragraph({
                    children: [new TextRun(line.length > 0 ? line : " ")],
                  })
              ),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      return Buffer.from(buffer);
    }

    case "pdf": {
      const pdf = await PDFDocument.create();
      let page = pdf.addPage([595.28, 841.89]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      const lineHeight = fontSize + 4;
      const margin = 48;
      let y = page.getHeight() - margin;

      const writeLine = (line: string, size = fontSize, isTitle = false) => {
        if (y < margin) {
          page = pdf.addPage([595.28, 841.89]);
          y = page.getHeight() - margin;
        }

        page.drawText(line, {
          x: margin,
          y,
          size,
          font,
          color: isTitle ? rgb(0.1, 0.1, 0.1) : rgb(0.18, 0.18, 0.18),
        });

        y -= isTitle ? lineHeight + 6 : lineHeight;
      };

      writeLine(title, 16, true);
      y -= 4;

      for (const rawLine of sanitizeLines(content)) {
        const line = rawLine.length > 0 ? rawLine : " ";
        writeLine(line);
      }

      return Buffer.from(await pdf.save());
    }

    case "pptx": {
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_STANDARD";

      const blocks = content
        .split(/\n\n+/)
        .map((block) => block.trim())
        .filter(Boolean);

      const firstSlide = pptx.addSlide();
      firstSlide.addText(title, {
        x: 0.6,
        y: 0.6,
        w: 12,
        h: 1,
        fontSize: 28,
        bold: true,
        color: "202938",
      });

      blocks.forEach((block, index) => {
        const slide = index === 0 ? firstSlide : pptx.addSlide();
        if (index !== 0) {
          slide.addText(title, {
            x: 0.6,
            y: 0.4,
            w: 12,
            h: 0.6,
            fontSize: 16,
            bold: true,
            color: "344054",
          });
        }

        slide.addText(block.slice(0, 1200), {
          x: 0.8,
          y: index === 0 ? 1.8 : 1.4,
          w: 11.5,
          h: 4.8,
          fontSize: 18,
          color: "111827",
          valign: "top",
          breakLine: true,
        });
      });

      const arrayBuffer = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;
      return Buffer.from(arrayBuffer);
    }

    case "xlsx": {
      const rows = sanitizeLines(content).map((line, index) => ({
        Ligne: index + 1,
        Contenu: line,
      }));
      const worksheet = utils.json_to_sheet(rows.length > 0 ? rows : [{ Ligne: 1, Contenu: "" }]);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Document");

      return Buffer.from(write(workbook, { type: "buffer", bookType: "xlsx" }));
    }

    default:
      throw new Error(`Unsupported format: ${format satisfies never}`);
  }
}

export function buildExportFileName(title: string, format: DocumentExportFormat) {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

  return `${safeTitle || "document"}.${format}`;
}
