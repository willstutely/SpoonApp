import { addRssSource } from "@/lib/ingestSource";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return Response.json({ error: "url is not valid" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const outcome = await addRssSource(url);

  switch (outcome.status) {
    case "ok":
      return Response.json(
        { sourceId: outcome.sourceId, itemsIngested: outcome.itemsIngested },
        { status: 201 }
      );
    case "already_exists":
      return Response.json(
        { error: "Source already exists", sourceId: outcome.sourceId },
        { status: 409 }
      );
    case "invalid_feed":
      return Response.json(
        { error: `Could not parse feed: ${outcome.message}` },
        { status: 422 }
      );
  }
}
