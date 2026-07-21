import type { EpisodeWeekData } from "./getEpisodeData";
import type { FlaggedCaseDevelopment } from "./getEpisodeData";

export type EpisodeSnapshotContent = {
  week: EpisodeWeekData;
  flaggedDevelopments: FlaggedCaseDevelopment[] | null;
};

export type EpisodeSnapshotSummary = {
  id: number;
  episodeDate: string;
  briefsGenerated: number[];
};

export type EpisodeSnapshotDetail = EpisodeSnapshotSummary & {
  content: EpisodeSnapshotContent;
};

/** Lists archived episodes, newest first. Never throws — see other getX helpers. */
export async function listEpisodeSnapshots(): Promise<
  EpisodeSnapshotSummary[] | null
> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const { db } = await import("@/db");
    const { episodeSnapshots } = await import("@/db/schema");
    const { desc } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(episodeSnapshots)
      .orderBy(desc(episodeSnapshots.episodeDate));

    return rows.map((r) => ({
      id: r.id,
      episodeDate: r.episodeDate.toISOString(),
      briefsGenerated: r.briefsGenerated,
    }));
  } catch {
    return null;
  }
}

export async function getEpisodeSnapshot(
  id: number
): Promise<EpisodeSnapshotDetail | "unavailable" | "not_found"> {
  if (!process.env.DATABASE_URL) return "unavailable";

  try {
    const { db } = await import("@/db");
    const { episodeSnapshots } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const [row] = await db
      .select()
      .from(episodeSnapshots)
      .where(eq(episodeSnapshots.id, id))
      .limit(1);

    if (!row) return "not_found";

    return {
      id: row.id,
      episodeDate: row.episodeDate.toISOString(),
      briefsGenerated: row.briefsGenerated,
      content: row.content as EpisodeSnapshotContent,
    };
  } catch {
    return "unavailable";
  }
}
