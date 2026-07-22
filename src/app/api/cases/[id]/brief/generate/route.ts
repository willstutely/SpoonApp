import { getOrGenerateBrief } from "@/lib/generateBrief";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/cases/[id]/brief/generate">
) {
  const { id } = await ctx.params;
  const caseId = Number(id);
  if (!Number.isInteger(caseId)) {
    return Response.json({ error: "Invalid case id" }, { status: 400 });
  }

  const outcome = await getOrGenerateBrief(caseId);

  switch (outcome.status) {
    case "ok":
      return Response.json({ brief: outcome.result });
    case "case_not_found":
      return Response.json({ error: "Case not found" }, { status: 404 });
    case "generation_failed":
      return Response.json({ error: outcome.message }, { status: 502 });
  }
}
