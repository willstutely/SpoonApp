import { getEpisodeWeekData, getFlaggedCaseDevelopments } from "@/lib/getEpisodeData";
import type { EpisodeSnapshotContent } from "@/lib/getEpisodeArchive";

/**
 * Freezes the current live episode view into an EpisodeSnapshot.
 * SPEC.md §2: runs Wednesday 12:01 AM ET, after the episode date has
 * passed. Vercel Cron sends a GET request (see vercel.json); POST is
 * also supported for manual/admin triggering. Both are protected by
 * CRON_SECRET so the endpoint can't be triggered by anyone who finds
 * the URL.
 */
async function freezeEpisode(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const week = getEpisodeWeekData(todayISO);
  const flaggedDevelopments = await getFlaggedCaseDevelopments();

  const content: EpisodeSnapshotContent = { week, flaggedDevelopments };

  try {
    const { db } = await import("@/db");
    const { episodeSnapshots } = await import("@/db/schema");

    const [row] = await db
      .insert(episodeSnapshots)
      .values({
        episodeDate: new Date(week.weekMonday),
        content,
        briefsGenerated: [],
      })
      .returning();

    return Response.json({ snapshot: row }, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to archive episode" }, { status: 500 });
  }
}

export const GET = freezeEpisode;
export const POST = freezeEpisode;
