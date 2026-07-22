import Parser from "rss-parser";
import { classifySourceLean } from "./classifySourceLean";
import { summarizeFeedItem } from "./summarizeFeedItem";

const parser = new Parser();

/** Runs `fn` over `items` with at most `concurrency` in flight at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export type AddSourceOutcome =
  | { status: "ok"; sourceId: number; itemsIngested: number }
  | { status: "already_exists"; sourceId: number }
  | { status: "invalid_feed"; message: string };

/**
 * Adds a new RSS source per SPEC.md §8: fetches the feed, creates a
 * pending-review Source row, classifies its lean (Haiku), and does an
 * initial poll to populate feedItems. New user-submitted sources always
 * start pendingReview=true — usable immediately but visually distinguished
 * until confirmed (no admin roles yet, so anyone can confirm for now).
 */
export async function addRssSource(url: string): Promise<AddSourceOutcome> {
  const { db } = await import("@/db");
  const { sources } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const [existing] = await db.select().from(sources).where(eq(sources.url, url)).limit(1);
  if (existing) return { status: "already_exists", sourceId: existing.id };

  let feed;
  try {
    feed = await parser.parseURL(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "invalid_feed", message };
  }

  const name = feed.title ?? url;
  const sampleTitles = (feed.items ?? []).slice(0, 8).map((i) => i.title ?? "").filter(Boolean);

  let lean: "liberty" | "state_power" | "unclassified" = "unclassified";
  try {
    lean = await classifySourceLean(name, url, sampleTitles);
  } catch {
    // Classification failing shouldn't block adding the source — it just
    // stays "unclassified" until a human sets it or a retry succeeds.
  }

  const [row] = await db
    .insert(sources)
    .values({
      name,
      type: "rss",
      url,
      lean,
      pendingReview: true,
    })
    .returning();

  const itemsIngested = await pollSource(row.id);
  return { status: "ok", sourceId: row.id, itemsIngested };
}

/**
 * Fetches a source's feed and inserts any items not already ingested
 * (by url). Returns the count of newly-ingested items. Never throws —
 * a broken feed is a health-monitoring concern (SPEC.md §9), not a crash.
 * Summarization runs with bounded concurrency (5 at once) rather than
 * sequentially — a feed with 40+ items took over a minute one-at-a-time.
 */
export async function pollSource(sourceId: number): Promise<number> {
  const { db } = await import("@/db");
  const { sources, feedItems } = await import("@/db/schema");
  const { eq, inArray } = await import("drizzle-orm");

  const [source] = await db.select().from(sources).where(eq(sources.id, sourceId)).limit(1);
  if (!source) return 0;

  let feed;
  try {
    feed = await parser.parseURL(source.url);
  } catch {
    return 0;
  }

  const candidates = (feed.items ?? []).filter((item) => item.link && item.title);
  const links = candidates.map((item) => item.link!);
  const existingLinks =
    links.length > 0
      ? new Set(
          (
            await db
              .select({ url: feedItems.url })
              .from(feedItems)
              .where(inArray(feedItems.url, links))
          ).map((r) => r.url)
        )
      : new Set<string>();

  const newItems = candidates.filter((item) => !existingLinks.has(item.link!));

  const rows = await mapWithConcurrency(newItems, 5, async (item) => {
    let summary: string | null = null;
    try {
      summary = await summarizeFeedItem(item.title!, item.contentSnippet ?? item.content ?? null);
    } catch {
      // Failed summary generation shouldn't block ingesting the item itself
      // — it just displays without one, same as any other AI-generation
      // failure elsewhere in the app.
    }
    return {
      sourceId: source.id,
      url: item.link!,
      title: item.title!,
      publishedAt: item.isoDate ? new Date(item.isoDate) : null,
      summary,
    };
  });

  if (rows.length > 0) {
    await db.insert(feedItems).values(rows);
  }

  await db.update(sources).set({ lastIngestedAt: new Date() }).where(eq(sources.id, sourceId));

  return rows.length;
}
