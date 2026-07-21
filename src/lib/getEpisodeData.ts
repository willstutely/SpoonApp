import {
  getEventsInRange,
  addDays,
  getWeekMonday,
  type DerivedCalendarEvent,
} from "./calendar";

export type EpisodeWeekData = {
  weekMonday: string;
  ordersThisWeek: DerivedCalendarEvent[];
  opinionsThisWeek: DerivedCalendarEvent[];
  argumentsPriorWeek: DerivedCalendarEvent[];
  lookingAhead: DerivedCalendarEvent[];
};

/**
 * Assembles the weekly episode view per SPEC.md §2: Monday orders (from the
 * prior week's Friday conference), the prior week's oral arguments, opinions
 * issued this week, and next week's Looking Ahead. Recess weeks still
 * generate — empty arrays render as "No activity this week", not hidden
 * sections, per Failure Behavior.
 */
export function getEpisodeWeekData(referenceISO: string): EpisodeWeekData {
  const weekMonday = getWeekMonday(referenceISO);
  const weekSunday = addDays(weekMonday, 6);
  const priorMonday = addDays(weekMonday, -7);
  const priorSunday = addDays(weekMonday, -1);
  const nextMonday = addDays(weekMonday, 7);
  const nextSunday = addDays(weekMonday, 13);

  const thisWeekEvents = getEventsInRange(weekMonday, weekSunday);
  const priorWeekEvents = getEventsInRange(priorMonday, priorSunday);

  return {
    weekMonday,
    ordersThisWeek: thisWeekEvents.filter((e) => e.type === "order"),
    opinionsThisWeek: thisWeekEvents.filter((e) => e.type === "opinion"),
    argumentsPriorWeek: priorWeekEvents.filter((e) => e.type === "argument"),
    lookingAhead: getEventsInRange(nextMonday, nextSunday),
  };
}

export type FlaggedCaseDevelopment = {
  caseId: number;
  caseTitle: string;
  scotusBound: boolean;
  items: {
    id: number;
    title: string;
    url: string;
    publishedAt: string | null;
  }[];
};

/**
 * Developments in flagged/SCOTUS-bound cases. Returns null when the
 * pipe is broken (DB reachable but query failed) vs. [] when there's
 * simply nothing flagged yet — same "unavailable vs. quiet" distinction
 * as feed sections. No per-user auth yet, so this surfaces every flagged
 * case globally until accounts/settings exist.
 */
export async function getFlaggedCaseDevelopments(): Promise<
  FlaggedCaseDevelopment[] | null
> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const { db } = await import("@/db");
    const { cases, feedItems } = await import("@/db/schema");
    const { or, eq, desc, sql } = await import("drizzle-orm");

    const flagged = await db
      .select()
      .from(cases)
      .where(
        or(
          eq(cases.scotusBound, true),
          sql`jsonb_array_length(${cases.flaggedBy}) > 0`
        )
      );

    return await Promise.all(
      flagged.map(async (c) => {
        const items = await db
          .select()
          .from(feedItems)
          .where(eq(feedItems.caseId, c.id))
          .orderBy(desc(feedItems.publishedAt))
          .limit(5);

        return {
          caseId: c.id,
          caseTitle: c.title,
          scotusBound: c.scotusBound,
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
