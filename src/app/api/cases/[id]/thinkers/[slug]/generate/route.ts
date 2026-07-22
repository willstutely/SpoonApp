import { getOrGenerateThinkerAnalysis } from "@/lib/generateThinkerAnalysis";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/cases/[id]/thinkers/[slug]/generate">
) {
  const { id, slug } = await ctx.params;
  const caseId = Number(id);
  if (!Number.isInteger(caseId)) {
    return Response.json({ error: "Invalid case id" }, { status: 400 });
  }

  const outcome = await getOrGenerateThinkerAnalysis(caseId, slug);

  switch (outcome.status) {
    case "ok":
      return Response.json({ analysis: outcome.result });
    case "case_not_found":
      return Response.json({ error: "Case not found" }, { status: 404 });
    case "thinker_not_found":
      return Response.json({ error: "Thinker not found" }, { status: 404 });
    case "generation_failed":
      return Response.json({ error: outcome.message }, { status: 502 });
  }
}
