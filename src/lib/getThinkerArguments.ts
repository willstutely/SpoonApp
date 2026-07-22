import type { CitedPassage } from "./generateThinkerAnalysis";

export type ThinkerGroup = "founder" | "founders_reading" | "historical";

export type ThinkerArgumentRow = {
  slug: string;
  name: string;
  group: ThinkerGroup;
  isCoreFramework: boolean;
  analysis: { summary: string; citedPassages: CitedPassage[] } | null;
};

export const GROUP_LABELS: Record<ThinkerGroup, string> = {
  founder: "Founder's Corner",
  founders_reading: "What the Founders Were Reading",
  historical: "Historical Thoughts",
};

/**
 * All thinker collections plus whatever's already been generated for this
 * case (globally cached — see generateThinkerAnalysis.ts). Never throws;
 * returns null to signal "unavailable" the same way the other getX helpers
 * do, so the page can degrade visibly rather than crash.
 */
export async function getThinkerArgumentsForCase(
  caseId: number
): Promise<ThinkerArgumentRow[] | null> {
  if (!process.env.DATABASE_URL) return null;

  try {
    const { db } = await import("@/db");
    const { sourceCollections, thinkerAnalyses } = await import("@/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const collections = await db
      .select()
      .from(sourceCollections)
      .where(eq(sourceCollections.kind, "thinker"));

    return await Promise.all(
      collections.map(async (c) => {
        const [analysis] = await db
          .select()
          .from(thinkerAnalyses)
          .where(
            and(
              eq(thinkerAnalyses.caseId, caseId),
              eq(thinkerAnalyses.collectionId, c.id)
            )
          )
          .limit(1);

        return {
          slug: c.slug,
          name: c.name,
          group: c.thinkerGroup as ThinkerGroup,
          isCoreFramework: c.isCoreFramework,
          analysis: analysis
            ? { summary: analysis.summary, citedPassages: analysis.citedPassages }
            : null,
        };
      })
    );
  } catch {
    return null;
  }
}
