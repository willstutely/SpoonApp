export async function POST(
  request: Request,
  ctx: RouteContext<"/api/cases/[id]/notes">
) {
  const { id } = await ctx.params;
  const caseId = Number(id);
  if (!Number.isInteger(caseId)) {
    return Response.json({ error: "Invalid case id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const timestampLabel = typeof body?.timestampLabel === "string" ? body.timestampLabel.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!timestampLabel || !note) {
    return Response.json(
      { error: "timestampLabel and note are required" },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { db } = await import("@/db");
    const { oralArgumentNotes } = await import("@/db/schema");

    const [row] = await db
      .insert(oralArgumentNotes)
      .values({ caseId, timestampLabel, note })
      .returning();

    return Response.json({ note: row }, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to save note" }, { status: 500 });
  }
}
