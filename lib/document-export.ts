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

const chunkText = (text: string, maxLen = 1200) => {
  if (text.length <= maxLen) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLen) {
    const candidate = remaining.slice(0, maxLen);
    const breakIndex = Math.max(
      candidate.lastIndexOf("\n"),
      candidate.lastIndexOf(". "),
      candidate.lastIndexOf(" ")
    );
    const splitAt = breakIndex > maxLen * 0.6 ? breakIndex : maxLen;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trimStart();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
};

const parseMarkdownLike = (content: string) => {
  const lines = sanitizeLines(content);
  const blocks: Array<
    | { type: "heading"; level: number; text: string }
    | { type: "bullet"; text: string }
    | { type: "paragraph"; text: string }
  > = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      blocks.push({
        type: "bullet",
        text: line.replace(/^[-*]\s+/, ""),
      });
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph" as const, text: content }];
};

const extractTableRows = (content: string) => {
  const rows = sanitizeLines(content)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.includes("|")) {
        return line
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell) => cell.length > 0);
      }
      if (line.includes(";")) {
        return line.split(";").map((cell) => cell.trim());
      }
      if (line.includes(",")) {
        return line.split(",").map((cell) => cell.trim());
      }
      return [line];
    });

  return rows;
};

export async function exportContentAsBuffer(
  title: string,
  content: string,
  format: DocumentExportFormat
): Promise<Buffer> {
  switch (format) {
    case "doc": {
      const blocks = parseMarkdownLike(content);
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                heading: "Heading1",
                children: [new TextRun({ text: title, bold: true })],
              }),
              ...blocks.map((block) => {
                if (block.type === "heading") {
                  return new Paragraph({
                    heading:
                      block.level === 1
                        ? "Heading2"
                        : block.level === 2
                          ? "Heading3"
                          : "Heading4",
                    children: [new TextRun({ text: block.text, bold: true })],
                  });
                }

                if (block.type === "bullet") {
                  return new Paragraph({
                    bullet: { level: 0 },
                    children: [new TextRun(block.text)],
                  });
                }

                return new Paragraph({
                  children: [new TextRun(block.text.length > 0 ? block.text : " ")],
                });
              }),
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

      for (const block of parseMarkdownLike(content)) {
        if (block.type === "heading") {
          writeLine(block.text, 13, true);
          continue;
        }

        const prefix = block.type === "bullet" ? "• " : "";
        for (const lineChunk of chunkText(`${prefix}${block.text}`, 90)) {
          writeLine(lineChunk, 11);
        }
      }

      return Buffer.from(await pdf.save());
    }

    case "pptx": {
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_STANDARD";

      const sections = content
        .split(/\n\n+/)
        .map((block) => block.trim())
        .filter(Boolean)
        .flatMap((section) => chunkText(section, 750));

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

      sections.forEach((section, index) => {
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

        slide.addText(section, {
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
      const tableRows = extractTableRows(content);
      const normalizedRows =
        tableRows.length > 0
          ? tableRows
          : [["Ligne", "Contenu"], ["1", content.trim()]];
      const worksheet = utils.aoa_to_sheet(normalizedRows);
      const range = utils.decode_range(worksheet["!ref"] ?? "A1:A1");
      const maxWidthByColumn: number[] = [];

      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cell = worksheet[utils.encode_cell({ r: row, c: col })];
          const value = String(cell?.v ?? "");
          maxWidthByColumn[col] = Math.max(maxWidthByColumn[col] ?? 10, value.length + 2);
        }
      }

      worksheet["!cols"] = maxWidthByColumn.map((width) => ({ wch: Math.min(width, 60) }));
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
