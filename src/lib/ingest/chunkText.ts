export type Passage = { anchorId: string; ordinal: number; text: string };

/**
 * Splits extracted raw text into paragraph-level passages for retrieval and
 * deep-linking (anchorId). PDF extraction (pdf-parse) emits one line per
 * visual line of the page plus "-- N of M --" page-break markers, not real
 * paragraph breaks, so soft-wrapped lines are rejoined before splitting on
 * blank-line boundaries.
 */
// Postgres text/varchar columns reject embedded NUL bytes outright (and
// other C0 control chars are almost always OCR/extraction artifacts, not
// real content), so strip them before anything reaches the database.
function sanitize(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

export function chunkIntoPassages(rawText: string, minLength = 40): Passage[] {
  const normalized = sanitize(rawText).replace(/\r\n/g, "\n");
  const noPageMarkers = normalized.replace(/^--\s*\d+\s*of\s*\d+\s*--$/gm, "");
  // Collapse single newlines (soft line wraps) into spaces, but preserve
  // blank-line runs as paragraph breaks.
  const collapsed = noPageMarkers.replace(/(?<!\n)\n(?!\n)/g, " ");
  const rawParagraphs = collapsed.split(/\n\s*\n+/);

  const passages: Passage[] = [];
  let ordinal = 0;
  for (const raw of rawParagraphs) {
    const text = raw.replace(/[ \t]+/g, " ").trim();
    if (text.length < minLength) continue;
    ordinal += 1;
    passages.push({ anchorId: `p${ordinal}`, ordinal, text });
  }
  return passages;
}
