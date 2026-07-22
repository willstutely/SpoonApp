import { pollSource } from "@/lib/ingestSource";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/sources/[id]/poll">
) {
  const { id } = await ctx.params;
  const sourceId = Number(id);
  if (!Number.isInteger(sourceId)) {
    return Response.json({ error: "Invalid source id" }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const itemsIngested = await pollSource(sourceId);
  return Response.json({ itemsIngested });
}
