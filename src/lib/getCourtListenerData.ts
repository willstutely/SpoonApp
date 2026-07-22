import {
  findDocketByNumber,
  getDocket,
  getCluster,
  getOpinion,
  resolveOpinions,
  getCitingOpinions,
  type CLCitationResult,
} from "./courtlistener";

export type CourtListenerData = {
  courtListenerUrl: string | null;
  decisionDate: string | null;
  /** Official syllabus text — either the metadata field or extracted from
   * the opinion's own plain text (many clusters leave the field empty even
   * though the slip opinion itself includes one). Never AI-generated. */
  syllabusExcerpt: string | null;
  downloadUrl: string | null;
  precedentGraph: {
    citesCount: number;
    citesSample: CLCitationResult[];
    citedByCount: number;
    citedBySample: CLCitationResult[];
  } | null;
};

const EMPTY: CourtListenerData = {
  courtListenerUrl: null,
  decisionDate: null,
  syllabusExcerpt: null,
  downloadUrl: null,
  precedentGraph: null,
};

/**
 * Resolves a case's CourtListener docket (caching the ID on first match,
 * per SPEC.md §"Entity resolution" — docket number is the primary key),
 * then pulls whatever's available: the official syllabus (zero
 * hallucination risk — it's the Court's own text, not AI-generated), the
 * official opinion PDF link, and a one-hop precedent sample in both
 * directions. Every piece is independently optional — a cert-pending case
 * has no cluster yet, that's normal, not a failure.
 */
export async function getCourtListenerData(
  caseId: number,
  docketNumber: string | null,
  court: string,
  courtlistenerId: string | null
): Promise<CourtListenerData | null> {
  if (!process.env.COURTLISTENER_API_TOKEN) return null;

  let docketId = courtlistenerId ? Number(courtlistenerId) : null;

  if (!docketId) {
    if (!docketNumber) return null;
    const docket = await findDocketByNumber(docketNumber, court);
    if (!docket) return null;
    docketId = docket.id;

    // Cache the match so future loads skip the search — best-effort, a
    // failed write here shouldn't break the page.
    try {
      const { db } = await import("@/db");
      const { cases } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      await db
        .update(cases)
        .set({ courtlistenerId: String(docketId) })
        .where(eq(cases.id, caseId));
    } catch {
      // non-fatal
    }
  }

  const docket = await getDocket(docketId);
  if (!docket) return EMPTY;

  const courtListenerUrl = `https://www.courtlistener.com/docket/${docketId}/`;

  if (docket.clusters.length === 0) {
    // No opinion yet — cert-pending or argued-but-undecided. Normal, not a failure.
    return { ...EMPTY, courtListenerUrl };
  }

  const cluster = await getCluster(docket.clusters[0]);
  if (!cluster) return { ...EMPTY, courtListenerUrl };

  const opinion = cluster.sub_opinions.length > 0 ? await getOpinion(cluster.sub_opinions[0]) : null;

  let precedentGraph: CourtListenerData["precedentGraph"] = null;
  if (opinion) {
    const citesSample = await resolveOpinions(opinion.opinions_cited.slice(0, 10));
    const citedBy = await getCitingOpinions(opinion.id, 10);
    precedentGraph = {
      citesCount: opinion.opinions_cited.length,
      citesSample,
      citedByCount: citedBy.count,
      citedBySample: citedBy.results,
    };
  }

  // Prefer the metadata field; many clusters leave it empty even though the
  // slip opinion's own text includes a syllabus at the start, so fall back
  // to a prefix of that.
  const syllabusExcerpt = cluster.syllabus || opinion?.plain_text?.slice(0, 3000) || null;

  return {
    courtListenerUrl: cluster.absolute_url
      ? `https://www.courtlistener.com${cluster.absolute_url}`
      : courtListenerUrl,
    decisionDate: cluster.date_filed,
    syllabusExcerpt,
    downloadUrl: opinion?.download_url || null,
    precedentGraph,
  };
}
