export type SourceDocumentDetail = {
  id: number;
  title: string;
  collectionName: string;
  collectionSlug: string;
  passages: { anchorId: string; ordinal: number; text: string }[];
};

export type SourceDocumentResult =
  | { status: "unavailable" }
  | { status: "not_found" }
  | { status: "ok"; document: SourceDocumentDetail };

/**
 * Renders one ingested source document with its passages, each carrying a
 * stable anchor id — this is the actual link target for the "self-hosted
 * sources... paragraph-level anchor IDs for permanent deep linking"
 * citation tier (SPEC.md §5 Generate Brief).
 */
export async function getSourceDocument(id: number): Promise<SourceDocumentResult> {
  if (!process.env.DATABASE_URL) return { status: "unavailable" };

  try {
    const { db } = await import("@/db");
    const { sourceDocuments, sourceCollections, sourcePassages } = await import("@/db/schema");
    const { eq, asc } = await import("drizzle-orm");

    const [doc] = await db
      .select()
      .from(sourceDocuments)
      .where(eq(sourceDocuments.id, id))
      .limit(1);
    if (!doc) return { status: "not_found" };

    const [collection] = await db
      .select()
      .from(sourceCollections)
      .where(eq(sourceCollections.id, doc.collectionId))
      .limit(1);

    const passages = await db
      .select()
      .from(sourcePassages)
      .where(eq(sourcePassages.documentId, id))
      .orderBy(asc(sourcePassages.ordinal));

    return {
      status: "ok",
      document: {
        id: doc.id,
        title: doc.title,
        collectionName: collection?.name ?? "Unknown",
        collectionSlug: collection?.slug ?? "",
        passages: passages.map((p) => ({
          anchorId: p.anchorId,
          ordinal: p.ordinal,
          text: p.text,
        })),
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}
