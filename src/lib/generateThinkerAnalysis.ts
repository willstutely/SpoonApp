import { eq, and } from "drizzle-orm";
import { getAnthropicClient } from "./anthropic";
import { modelFor } from "./models";
import { getRelevantPassages, type RetrievedPassage } from "./retrievePassages";

export type CitedPassage = {
  documentTitle: string;
  anchorId: string;
  quote: string;
  /** Optional — older cached rows predate this field. */
  documentId?: number;
};

export type ThinkerAnalysisResult = {
  collectionSlug: string;
  collectionName: string;
  isCoreFramework: boolean;
  summary: string;
  citedPassages: CitedPassage[];
  cached: boolean;
};

export type ThinkerAnalysisOutcome =
  | { status: "ok"; result: ThinkerAnalysisResult }
  | { status: "case_not_found" }
  | { status: "thinker_not_found" }
  | { status: "generation_failed"; message: string };

function buildPrompt(
  thinkerName: string,
  isCoreFramework: boolean,
  caseTitle: string,
  docketNumber: string | null,
  court: string,
  status: string,
  passages: RetrievedPassage[]
): { system: string; user: string } {
  const system = `You write short philosophical/legal commentary in the voice of specific historical and contemporary thinkers, for "Knives and Spoons" — a podcast analyzing U.S. Supreme Court and federal appellate cases through a Lysander Spooner natural law framework.

Channel ${thinkerName}'s actual documented views and reasoning style. Ground your commentary specifically in the source excerpts provided — quote or closely paraphrase them where relevant. Do not give generic commentary that could apply to any thinker.${
    isCoreFramework
      ? ` ${thinkerName} is the ideological anchor of the show — prioritize fidelity to his actual arguments above all else. This is the gold-standard voice the whole framework is built on.`
      : ""
  }

Write 2-4 sentences, plain text, no preamble, no markdown.`;

  const excerptBlock =
    passages.length > 0
      ? passages
          .map((p, i) => `[${i + 1}] From "${p.documentTitle}":\n${p.text}`)
          .join("\n\n")
      : null;

  const user = `Case: ${caseTitle}${docketNumber ? ` (No. ${docketNumber})` : ""}
Court: ${court}
Status: ${status}

${
  excerptBlock
    ? `Source excerpts from ${thinkerName}'s writings:\n\n${excerptBlock}`
    : `No source excerpts were found in the corpus for this specific topic. Answer using your general knowledge of ${thinkerName}'s documented views, and make clear this isn't grounded in a specific passage.`
}

Write ${thinkerName}'s take on this case now.`;

  return { system, user };
}

/**
 * Generates (or returns the cached) analysis for one thinker on one case.
 * Cached globally per SPEC.md's cost principles — never regenerated once
 * it exists, regardless of which user's "default five" triggered it.
 */
export async function getOrGenerateThinkerAnalysis(
  caseId: number,
  collectionSlug: string
): Promise<ThinkerAnalysisOutcome> {
  const { db } = await import("@/db");
  const { cases, sourceCollections, thinkerAnalyses } = await import("@/db/schema");

  const [caseRow] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRow) return { status: "case_not_found" };

  const [collection] = await db
    .select()
    .from(sourceCollections)
    .where(and(eq(sourceCollections.slug, collectionSlug), eq(sourceCollections.kind, "thinker")))
    .limit(1);
  if (!collection) return { status: "thinker_not_found" };

  const [existing] = await db
    .select()
    .from(thinkerAnalyses)
    .where(
      and(
        eq(thinkerAnalyses.caseId, caseId),
        eq(thinkerAnalyses.collectionId, collection.id)
      )
    )
    .limit(1);

  if (existing) {
    return {
      status: "ok",
      result: {
        collectionSlug,
        collectionName: collection.name,
        isCoreFramework: collection.isCoreFramework,
        summary: existing.summary,
        citedPassages: existing.citedPassages,
        cached: true,
      },
    };
  }

  try {
    const passages = await getRelevantPassages(collectionSlug, caseRow.title, 5);
    const { system, user } = buildPrompt(
      collection.name,
      collection.isCoreFramework,
      caseRow.title,
      caseRow.docketNumber,
      caseRow.court,
      caseRow.status,
      passages
    );

    const model = modelFor("thinkerAnalysis");
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model,
      max_tokens: 400,
      system,
      messages: [{ role: "user", content: user }],
    });

    const summary = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const citedPassages: CitedPassage[] = passages.map((p) => ({
      documentId: p.documentId,
      documentTitle: p.documentTitle,
      anchorId: p.anchorId,
      quote: p.text.slice(0, 280),
    }));

    const [inserted] = await db
      .insert(thinkerAnalyses)
      .values({
        caseId,
        collectionId: collection.id,
        summary,
        citedPassages,
        model,
      })
      .onConflictDoNothing()
      .returning();

    // Lost the race to a concurrent request — fetch what it wrote instead.
    const finalRow =
      inserted ??
      (
        await db
          .select()
          .from(thinkerAnalyses)
          .where(
            and(
              eq(thinkerAnalyses.caseId, caseId),
              eq(thinkerAnalyses.collectionId, collection.id)
            )
          )
          .limit(1)
      )[0];

    return {
      status: "ok",
      result: {
        collectionSlug,
        collectionName: collection.name,
        isCoreFramework: collection.isCoreFramework,
        summary: finalRow.summary,
        citedPassages: finalRow.citedPassages,
        cached: false,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "generation_failed", message };
  }
}
