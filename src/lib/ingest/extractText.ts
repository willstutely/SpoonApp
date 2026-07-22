import AdmZip from "adm-zip";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";

export type ExtractedFormat = "pdf" | "epub";

/**
 * Detects format by magic bytes rather than file extension — some files in
 * the source library (e.g. "Bushell's Case/Bushell") have no extension at all.
 */
export function sniffFormat(buffer: Buffer): ExtractedFormat | null {
  if (buffer.subarray(0, 4).toString("latin1") === "%PDF") return "pdf";
  if (buffer.subarray(0, 2).toString("latin1") === "PK") return "epub";
  return null;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

function extractEpubText(buffer: Buffer): string {
  const zip = new AdmZip(buffer);

  const containerEntry = zip.getEntry("META-INF/container.xml");
  if (!containerEntry) throw new Error("Not a valid EPUB: missing container.xml");
  const container = cheerio.load(containerEntry.getData().toString("utf-8"), {
    xmlMode: true,
  });
  const opfPath = container("rootfile").attr("full-path");
  if (!opfPath) throw new Error("Not a valid EPUB: no rootfile in container.xml");

  const opfEntry = zip.getEntry(opfPath);
  if (!opfEntry) throw new Error(`Not a valid EPUB: missing ${opfPath}`);
  const opf = cheerio.load(opfEntry.getData().toString("utf-8"), { xmlMode: true });

  const manifest = new Map<string, string>();
  opf("manifest > item").each((_, el) => {
    const id = opf(el).attr("id");
    const href = opf(el).attr("href");
    if (id && href) manifest.set(id, href);
  });

  const spineIds: string[] = [];
  opf("spine > itemref").each((_, el) => {
    const idref = opf(el).attr("idref");
    if (idref) spineIds.push(idref);
  });

  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  const chunks: string[] = [];
  for (const idref of spineIds) {
    const href = manifest.get(idref);
    if (!href) continue;
    const entryPath = opfDir + href;
    const entry = zip.getEntry(entryPath) ?? zip.getEntry(decodeURIComponent(entryPath));
    if (!entry) continue;
    const html = entry.getData().toString("utf-8");
    const $ = cheerio.load(html);
    chunks.push($("body").text());
  }

  return chunks.join("\n\n");
}

export async function extractText(
  buffer: Buffer
): Promise<{ format: ExtractedFormat; text: string }> {
  const format = sniffFormat(buffer);
  if (!format) throw new Error("Unrecognized file format (not PDF or EPUB)");

  if (format === "pdf") {
    return { format, text: await extractPdfText(buffer) };
  }
  return { format, text: extractEpubText(buffer) };
}
