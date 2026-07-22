import Link from "next/link";

export type Citation = {
  documentTitle: string;
  anchorId: string;
  documentId?: number;
};

/** One link per unique source document, keeping the first anchor cited for it. */
export function dedupeCitations<T extends Citation>(citations: T[]): T[] {
  const seen = new Map<string, T>();
  for (const c of citations) {
    const key = c.documentId !== undefined ? String(c.documentId) : c.documentTitle;
    if (!seen.has(key)) seen.set(key, c);
  }
  return [...seen.values()];
}

export function CitationLink({ citation }: { citation: Citation }) {
  if (citation.documentId === undefined) {
    return <span>{citation.documentTitle}</span>;
  }
  return (
    <Link
      href={`/library/documents/${citation.documentId}#${citation.anchorId}`}
      className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
    >
      {citation.documentTitle}
    </Link>
  );
}
