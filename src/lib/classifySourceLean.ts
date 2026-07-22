import { getAnthropicClient } from "./anthropic";
import { modelFor } from "./models";

export type SourceLean = "liberty" | "state_power" | "unclassified";

/**
 * Haiku classifies a new source's political lean on ingest, per SPEC.md
 * §8 Source Management. Never re-classified once a human overrides it
 * (leanOverridden) — that's enforced by the caller, not here.
 */
export async function classifySourceLean(
  name: string,
  url: string,
  sampleTitles: string[]
): Promise<SourceLean> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: modelFor("sourceLeanClassification"),
    max_tokens: 10,
    system:
      'Classify a news/commentary source as "liberty" (skeptical of state power, favors individual/natural rights), "state_power" (favors government authority/institutional deference), or "unclassified" (genuinely mixed, neutral, or not enough signal). Respond with exactly one of those three words, nothing else.',
    messages: [
      {
        role: "user",
        content: `Source: ${name} (${url})\nRecent headlines:\n${sampleTitles.map((t) => `- ${t}`).join("\n")}`,
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim()
    .toLowerCase();

  if (text.includes("state_power") || text.includes("state power")) return "state_power";
  if (text.includes("liberty")) return "liberty";
  return "unclassified";
}
