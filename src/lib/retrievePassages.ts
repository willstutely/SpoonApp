import { sql } from "drizzle-orm";

export type RetrievedPassage = {
  documentTitle: string;
  anchorId: string;
  text: string;
  rank: number;
};

// Builds an OR-of-terms tsquery string (e.g. "jury | nullification | law")
// rather than using websearch_to_tsquery's implicit AND — a case's issue
// summary rarely has every keyword co-occurring in one paragraph-sized
// passage, so requiring all terms returns nothing useful in practice.
// Only alphanumeric words survive, so the result is always valid tsquery
// syntax regardless of what the caller passes in.
function buildOrTsQuery(query: string): string {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  return words.join(" | ");
}

/**
 * Full-text search retrieval for grounding thinker-generation prompts in
 * their actual writings, per SPEC.md's "gold standard" framing — Spooner
 * (and every other ingested thinker) should be quoted from real passages,
 * not just recalled from the model's training data. Uses Postgres FTS
 * (already committed to for app-wide search, SPEC.md item 10) rather than
 * a vector DB — the corpus is small enough that this is plenty.
 */
export async function getRelevantPassages(
  collectionSlug: string,
  query: string,
  limit = 5
): Promise<RetrievedPassage[]> {
  const tsQuery = buildOrTsQuery(query);
  if (!tsQuery) return [];

  const { db } = await import("@/db");

  const result = await db.execute<{
    document_title: string;
    anchor_id: string;
    text: string;
    rank: number;
  }>(sql`
    select
      sd.title as document_title,
      sp.anchor_id,
      sp.text,
      ts_rank(to_tsvector('english', sp.text), to_tsquery('english', ${tsQuery})) as rank
    from source_passages sp
    join source_documents sd on sd.id = sp.document_id
    join source_collections sc on sc.id = sd.collection_id
    where sc.slug = ${collectionSlug}
      and to_tsvector('english', sp.text) @@ to_tsquery('english', ${tsQuery})
    order by rank desc
    limit ${limit}
  `);

  return result.rows.map((r) => ({
    documentTitle: r.document_title,
    anchorId: r.anchor_id,
    text: r.text,
    rank: r.rank,
  }));
}
