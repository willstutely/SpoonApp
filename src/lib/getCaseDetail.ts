export type CaseRow = {
  id: number;
  docketNumber: string | null;
  courtlistenerId: string | null;
  title: string;
  court: "scotus" | "circuit" | "district";
  status: string;
  scotusBound: boolean;
  flaggedBy: string[];
};

export type OralArgumentNoteRow = {
  id: number;
  timestampLabel: string;
  note: string;
  createdAt: string;
};

export type CaseDetailResult =
  | { status: "unavailable" }
  | { status: "not_found" }
  | { status: "ok"; case: CaseRow; notes: OralArgumentNoteRow[] };

/**
 * Loads a case and its oral argument notes. Distinguishes "DB not
 * configured / query failed" (unavailable) from "no such case"
 * (not_found), per SPEC.md Failure Behavior — never conflate the two.
 */
export async function getCaseDetail(id: number): Promise<CaseDetailResult> {
  if (!process.env.DATABASE_URL) {
    return { status: "unavailable" };
  }

  try {
    const { db } = await import("@/db");
    const { cases, oralArgumentNotes } = await import("@/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const [row] = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
    if (!row) return { status: "not_found" };

    const notes = await db
      .select()
      .from(oralArgumentNotes)
      .where(eq(oralArgumentNotes.caseId, id))
      .orderBy(desc(oralArgumentNotes.createdAt));

    return {
      status: "ok",
      case: row,
      notes: notes.map((n) => ({
        id: n.id,
        timestampLabel: n.timestampLabel,
        note: n.note,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  } catch {
    return { status: "unavailable" };
  }
}
