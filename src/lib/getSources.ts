export type SourceRow = {
  id: number;
  name: string;
  type: "rss" | "api" | "scrape";
  url: string;
  summary: string | null;
  lean: "liberty" | "state_power" | "unclassified";
  leanOverridden: boolean;
  pendingReview: boolean;
  lastIngestedAt: string | null;
  items: { id: number; title: string; url: string; publishedAt: string | null }[];
};

/** Never throws — returns null to signal "unavailable" like the other getX helpers. */
export async function getSources(): Promise<SourceRow[] | null> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const { db } = await import("@/db");
    const { sources, feedItems } = await import("@/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const rows = await db.select().from(sources).orderBy(desc(sources.createdAt));

    return await Promise.all(
      rows.map(async (s) => {
        const items = await db
          .select()
          .from(feedItems)
          .where(eq(feedItems.sourceId, s.id))
          .orderBy(desc(feedItems.publishedAt))
          .limit(10);

        return {
          id: s.id,
          name: s.name,
          type: s.type,
          url: s.url,
          summary: s.summary,
          lean: s.lean,
          leanOverridden: s.leanOverridden,
          pendingReview: s.pendingReview,
          lastIngestedAt: s.lastIngestedAt ? s.lastIngestedAt.toISOString() : null,
          items: items.map((i) => ({
            id: i.id,
            title: i.title,
            url: i.url,
            publishedAt: i.publishedAt ? i.publishedAt.toISOString() : null,
          })),
        };
      })
    );
  } catch {
    return null;
  }
}
