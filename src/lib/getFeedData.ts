import { SEED_SOURCES, type SeedSource } from "./sources";

export type FeedItemView = {
  id: number;
  title: string;
  url: string;
  publishedAt: string | null;
  summary: string | null;
};

export type SourceFeedView = {
  source: SeedSource;
  items: FeedItemView[];
  /** Set when the pipe is broken (query/ingest failure) vs. just quiet. */
  unavailableSince: string | null;
};

/**
 * Loads feed items per seed source. Never throws — a dead DB connection or
 * missing ingestion pipeline degrades visibly (unavailableSince set) rather
 * than silently blanking the section, per SPEC.md Failure Behavior.
 */
export async function getFeedData(): Promise<SourceFeedView[]> {
  if (!process.env.DATABASE_URL) {
    return SEED_SOURCES.map((source) => ({
      source,
      items: [],
      unavailableSince: null,
    }));
  }

  try {
    const { db } = await import("@/db");
    const { sources, feedItems } = await import("@/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    return await Promise.all(
      SEED_SOURCES.map(async (source) => {
        try {
          const [row] = await db
            .select()
            .from(sources)
            .where(eq(sources.url, source.url))
            .limit(1);

          if (!row) {
            return { source, items: [], unavailableSince: null };
          }

          const rows = await db
            .select()
            .from(feedItems)
            .where(eq(feedItems.sourceId, row.id))
            .orderBy(desc(feedItems.publishedAt))
            .limit(10);

          return {
            source,
            items: rows.map((r) => ({
              id: r.id,
              title: r.title,
              url: r.url,
              publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
              summary: r.summary,
            })),
            unavailableSince: null,
          };
        } catch {
          return {
            source,
            items: [],
            unavailableSince: new Date().toISOString(),
          };
        }
      })
    );
  } catch {
    return SEED_SOURCES.map((source) => ({
      source,
      items: [],
      unavailableSince: new Date().toISOString(),
    }));
  }
}
