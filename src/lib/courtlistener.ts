const BASE_URL = "https://www.courtlistener.com/api/rest/v4";

/**
 * Thin CourtListener REST v4 client. Never throws on API-level failures —
 * callers get null/empty results and degrade visibly, per SPEC.md Failure
 * Behavior ("CourtListener rate limiting: back off... never drop requests
 * silently" — for v1 this means "return gracefully," not yet the full
 * exponential-backoff queue described in spec).
 */
async function clFetch<T>(path: string): Promise<T | null> {
  const token = process.env.COURTLISTENER_API_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type CLDocket = {
  id: number;
  clusters: string[];
};

export type CLCluster = {
  id: number;
  case_name: string;
  date_filed: string | null;
  syllabus: string;
  procedural_history: string;
  sub_opinions: string[];
  citation_count: number;
  absolute_url: string;
};

export type CLOpinion = {
  id: number;
  download_url: string;
  opinions_cited: string[];
  plain_text: string;
};

export type CLCitationResult = {
  caseName: string;
  docketNumber: string;
  dateFiled: string | null;
  absolute_url: string;
};

/**
 * SCOTUS cases commonly have two docket records — one from the cert/
 * petition stage (no cluster yet) and one attached to the eventual
 * decision. A bare "exactly one match" check rejects that as ambiguous
 * even though it isn't: if precisely one candidate has a cluster attached,
 * that's the real disambiguator, not a guess. Falls back to "exactly one
 * match total" when none do (nothing decided yet). Anything genuinely
 * ambiguous (0 or 2+ with clusters) stays unlinked, per SPEC.md's entity
 * resolution bias toward unlinked over mislinked.
 */
export async function findDocketByNumber(
  docketNumber: string,
  court: string
): Promise<CLDocket | null> {
  const result = await clFetch<{ count: number; results: CLDocket[] }>(
    `/dockets/?docket_number=${encodeURIComponent(docketNumber)}&court=${court}`
  );
  if (!result) return null;

  if (result.results.length === 1) return result.results[0];

  const withClusters = result.results.filter((d) => d.clusters.length > 0);
  if (withClusters.length === 1) return withClusters[0];

  return null;
}

export async function getDocket(id: number): Promise<CLDocket | null> {
  return clFetch<CLDocket>(`/dockets/${id}/`);
}

function idFromUrl(url: string): number | null {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

export async function getCluster(url: string): Promise<CLCluster | null> {
  const id = idFromUrl(url);
  if (!id) return null;
  return clFetch<CLCluster>(`/clusters/${id}/`);
}

export async function getOpinion(url: string): Promise<CLOpinion | null> {
  const id = idFromUrl(url);
  if (!id) return null;
  return clFetch<CLOpinion>(`/opinions/${id}/`);
}

/** Batch-resolves a sample of opinion IDs (from bare citation URLs) to case names/dates in one call. */
export async function resolveOpinions(opinionUrls: string[]): Promise<CLCitationResult[]> {
  const ids = opinionUrls.map(idFromUrl).filter((id): id is number => id !== null);
  if (ids.length === 0) return [];

  const q = `id:(${ids.join(" OR ")})`;
  const result = await clFetch<{ results: CLCitationResult[] }>(
    `/search/?q=${encodeURIComponent(q)}&type=o`
  );
  return result?.results ?? [];
}

/** Opinions that cite this one — CourtListener's citation lookup API (SPEC.md §4 Precedent Graph). */
export async function getCitingOpinions(
  opinionId: number,
  limit = 10
): Promise<{ count: number; results: CLCitationResult[] }> {
  const result = await clFetch<{ count: number; results: CLCitationResult[] }>(
    `/search/?q=${encodeURIComponent(`cites:(${opinionId})`)}&type=o`
  );
  return { count: result?.count ?? 0, results: (result?.results ?? []).slice(0, limit) };
}
