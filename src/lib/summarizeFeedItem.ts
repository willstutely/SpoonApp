import { getAnthropicClient } from "./anthropic";
import { modelFor } from "./models";

/**
 * Haiku one-paragraph summary for an aggregator feed item, per SPEC.md §1.
 * Simplification vs. spec: generated eagerly at ingest for every tier here
 * rather than the full priority/court-coverage-at-ingest vs.
 * commentary-on-first-view split, and via a real-time call rather than the
 * Batch API — both are cost optimizations to revisit once real polling
 * volume justifies the added complexity.
 */
export async function summarizeFeedItem(
  title: string,
  excerpt: string | null
): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: modelFor("feedSummary"),
    max_tokens: 150,
    system:
      "Write a single neutral, informative paragraph (2-3 sentences) summarizing this article for a legal-news aggregator. No preamble, no markdown.",
    messages: [
      {
        role: "user",
        content: excerpt ? `Title: ${title}\n\nExcerpt: ${excerpt}` : `Title: ${title}`,
      },
    ],
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
