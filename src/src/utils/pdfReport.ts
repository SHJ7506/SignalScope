/**
 * Minimal dependency-free PDF writer.
 *
 * Produces a valid single/multi-page PDF 1.4 document from plain text lines.
 * Only ASCII is emitted (WinAnsi), so byte offsets equal string lengths.
 */

export interface PdfLine {
  text: string;
  bold?: boolean;
  size?: number;
  /** Insert one blank spacer line before this line. */
  gapBefore?: boolean;
}

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 56;
const BOTTOM = 56;

const ASCII_MAP: Record<string, string> = {
  "—": "-",
  "–": "-",
  "·": "-",
  "’": "'",
  "‘": "'",
  "“": '"',
  "”": '"',
  "…": "...",
  "✓": "*",
  "≥": ">=",
  "≤": "<=",
};

function toAscii(input: string): string {
  let out = "";
  for (const ch of input) {
    if (ch in ASCII_MAP) out += ASCII_MAP[ch];
    else out += ch.codePointAt(0)! < 128 ? ch : "";
  }
  return out;
}

function escapePdf(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string, size: number): string[] {
  const maxChars = Math.floor((PAGE_W - MARGIN * 2) / (size * 0.52));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/** Build a PDF Blob from the given lines. */
export function buildReportPdf(lines: PdfLine[]): Blob {
  // Expand into positioned rows, paginating as we go.
  interface Row {
    text: string;
    bold: boolean;
    size: number;
  }
  const pages: Row[][] = [];
  let current: Row[] = [];
  let y = PAGE_H - MARGIN;

  const pushRow = (row: Row, lineHeight: number) => {
    if (y - lineHeight < BOTTOM) {
      pages.push(current);
      current = [];
      y = PAGE_H - MARGIN;
    }
    y -= lineHeight;
    current.push(row);
  };

  for (const line of lines) {
    const size = line.size ?? 10;
    const lineHeight = Math.round(size * 1.5);
    if (line.gapBefore) {
      pushRow({ text: "", bold: false, size }, lineHeight);
    }
    for (const wrapped of wrap(toAscii(line.text), size)) {
      pushRow({ text: wrapped, bold: !!line.bold, size }, lineHeight);
    }
  }
  if (current.length) pages.push(current);
  if (!pages.length) pages.push([{ text: "", bold: false, size: 10 }]);

  // Assign object ids.
  const pageCount = pages.length;
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  let nextId = 3;
  for (let i = 0; i < pageCount; i++) {
    pageIds.push(nextId++);
    contentIds.push(nextId++);
  }
  const fontRegular = nextId++;
  const fontBold = nextId++;

  // Build content streams using the same uniform leading as pagination.
  const contentStreams: string[] = pages.map((rows) => {
    let yy = PAGE_H - MARGIN;
    let ops = "BT\n";
    for (const row of rows) {
      const lineHeight = Math.round(row.size * 1.5);
      yy -= lineHeight;
      ops += `/${row.bold ? "F2" : "F1"} ${row.size} Tf\n`;
      ops += `1 0 0 1 ${MARGIN} ${yy} Tm\n`;
      ops += `(${escapePdf(row.text)}) Tj\n`;
    }
    ops += "ET\n";
    return ops;
  });

  // Assemble objects.
  const objects: string[] = [];
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageCount} >>`;

  pages.forEach((_, i) => {
    objects[pageIds[i]] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> ` +
      `/Contents ${contentIds[i]} 0 R >>`;
    const stream = contentStreams[i];
    objects[contentIds[i]] =
      `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
  });

  objects[fontRegular] =
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objects[fontBold] =
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  // Serialize with byte offsets.
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  const total = nextId; // ids 1..nextId-1
  for (let id = 1; id < total; id++) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${total}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let id = 1; id < total; id++) {
    pdf += `${offsets[id].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  // Convert to bytes (ASCII-safe).
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}
