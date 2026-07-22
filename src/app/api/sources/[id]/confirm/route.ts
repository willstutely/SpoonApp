/** Confirms a pending-review source, per SPEC.md §8 Quality Control. */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/sources/[id]/confirm">
) {
  const { id } = await ctx.params;
  const sourceId = Number(id);
  if (!Number.isInteger(sourceId)) {
    return Response.json({ error: "Invalid source id" }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const { db } = await import("@/db");
  const { sources } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  await db.update(sources).set({ pendingReview: false }).where(eq(sources.id, sourceId));
  return Response.json({ ok: true });
}
