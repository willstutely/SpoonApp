const VALID_LEANS = new Set(["liberty", "state_power", "unclassified"]);

/**
 * Manual lean override, per SPEC.md §8: "any user can override the
 * classification, and an override is permanent until manually changed
 * (never re-classified by AI)." No auth/roles yet, so any caller can do
 * this for now — matches how the rest of the app handles missing auth.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/sources/[id]/lean">
) {
  const { id } = await ctx.params;
  const sourceId = Number(id);
  if (!Number.isInteger(sourceId)) {
    return Response.json({ error: "Invalid source id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const lean = body?.lean;
  if (typeof lean !== "string" || !VALID_LEANS.has(lean)) {
    return Response.json({ error: "lean must be liberty, state_power, or unclassified" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const { db } = await import("@/db");
  const { sources } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  await db
    .update(sources)
    .set({ lean: lean as "liberty" | "state_power" | "unclassified", leanOverridden: true })
    .where(eq(sources.id, sourceId));

  return Response.json({ ok: true });
}
