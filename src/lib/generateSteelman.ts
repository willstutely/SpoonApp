import { eq } from "drizzle-orm";
import { getAnthropicClient } from "./anthropic";
import { modelFor } from "./models";
import { getRelevantPassages, type RetrievedPassage } from "./retrievePassages";
import type { CitedPassage } from "./generateThinkerAnalysis";

// Blackstone is spec's explicit "opposition/state-power voice" among the
// default five — grounding the steelman in his corpus specifically, rather
// than a generic "argue the other side," gives it a real institutional
// tradition to draw from instead of a strawman.
const STEELMAN_COLLECTION_SLUG = "blackstone";

export type SteelmanResult = {
  steelman: string;
  citedPassages: CitedPassage[];
  cached: boolean;
};

export type SteelmanOutcome =
  | { status: "ok"; result: SteelmanResult }
  | { status: "case_not_found" }
  | { status: "generation_failed"; message: string };

function buildPrompt(
  caseTitle: string,
  docketNumber: string | null,
  court: string,
  status: string,
  passages: RetrievedPassage[]
): { system: string; user: string } {
  const system = `You write the steelman — the strongest good-faith argument — for the state-power/institutional-deference position, for "Knives and Spoons," a podcast that otherwise analyzes cases through a Lysander Spooner natural law framework. This section exists specifically so the show engages the best version of the opposing view, not a strawman.

Write from the institutional/legal-positivist tradition (Blackstone's, specifically) — sovereign authority, settled procedure, the case for judicial restraint and deference to enacted law over natural-law claims. Ground it in the source excerpts provided where relevant. 2-4 sentences, plain text, no preamble, no markdown.`;

  const excerptBlock =
    passages.length > 0
      ? passages.map((p, i) => `[${i + 1}] From "${p.documentTitle}":\n${p.text}`).join("\n\n")
      : null;

  const user = `Case: ${caseTitle}${docketNumber ? ` (No. ${docketNumber})` : ""}
Court: ${court}
Status: ${status}

${
  excerptBlock
    ? `Source excerpts from Blackstone's writings:\n\n${excerptBlock}`
    : `No source excerpts were found in the corpus for this specific topic. Answer using general knowledge of the legal-positivist/institutional-deference tradition, and make clear this isn't grounded in a specific passage.`
}

Write the steelman now.`;

  return { system, user };
}

/**
 * Generates (or returns the cached) steelman for a case. Cached globally,
 * same cost principle as thinker analyses — never regenerated once it
 * exists.
 */
export async function getOrGenerateSteelman(caseId: number): Promise<SteelmanOutcome> {
  const { db } = await import("@/db");
  const { cases } = await import("@/db/schema");

  const [caseRow] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRow) return { status: "case_not_found" };

  if (caseRow.steelman) {
    return {
      status: "ok",
      result: {
        steelman: caseRow.steelman,
        citedPassages: caseRow.steelmanCitedPassages ?? [],
        cached: true,
      },
    };
  }

  try {
    const passages = await getRelevantPassages(STEELMAN_COLLECTION_SLUG, caseRow.title, 5);
    const { system, user } = buildPrompt(
      caseRow.title,
      caseRow.docketNumber,
      caseRow.court,
      caseRow.status,
      passages
    );

    const model = modelFor("steelman");
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model,
      max_tokens: 400,
      system,
      messages: [{ role: "user", content: user }],
    });

    const steelman = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const citedPassages: CitedPassage[] = passages.map((p) => ({
      documentTitle: p.documentTitle,
      anchorId: p.anchorId,
      quote: p.text.slice(0, 280),
    }));

    // Guard against a concurrent request winning the race: only write if
    // still empty, then read back whatever ended up stored either way.
    await db
      .update(cases)
      .set({
        steelman,
        steelmanCitedPassages: citedPassages,
        steelmanModel: model,
        steelmanGeneratedAt: new Date(),
      })
      .where(eq(cases.id, caseId));

    const [finalRow] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);

    return {
      status: "ok",
      result: {
        steelman: finalRow.steelman!,
        citedPassages: finalRow.steelmanCitedPassages ?? [],
        cached: false,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "generation_failed", message };
  }
}
