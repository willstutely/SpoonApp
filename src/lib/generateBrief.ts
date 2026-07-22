import { eq } from "drizzle-orm";
import { getAnthropicClient } from "./anthropic";
import { modelFor } from "./models";
import { getRelevantPassagesByKind } from "./retrievePassages";

export type BriefCitation = { documentTitle: string; anchorId: string; documentId: number };

export type BriefContent = {
  overview: string;
  philosophicalAnalysis: string;
  historicalReview: string;
  citations: BriefCitation[];
};

export type BriefResult = { brief: BriefContent; cached: boolean };

export type BriefOutcome =
  | { status: "ok"; result: BriefResult }
  | { status: "case_not_found" }
  | { status: "generation_failed"; message: string };

const ASSEMBLE_BRIEF_TOOL = {
  name: "assemble_brief",
  description: "Assembles the structured show-prep brief from the supplied cached material.",
  input_schema: {
    type: "object" as const,
    properties: {
      overview: {
        type: "string",
        description: "Case overview: what it's about, procedural posture, why it matters.",
      },
      philosophicalAnalysis: {
        type: "string",
        description:
          "Organized synthesis of the supplied thinker arguments and steelman into a coherent for/against discussion. Do not invent new arguments — connect and organize what's provided.",
      },
      historicalReview: {
        type: "string",
        description:
          "Historical review of relevant case law, drawing only on the supplied historical case-law excerpts. If none are genuinely relevant to this case's issue, say so plainly rather than forcing a connection.",
      },
    },
    required: ["overview", "philosophicalAnalysis", "historicalReview"],
  },
};

/**
 * Assembles and synthesizes the Generate Brief deliverable (SPEC.md §5)
 * from already-cached components — thinker analyses, steelman, and a
 * retrieval pass over the historical_case corpus — rather than re-deriving
 * anything from scratch. Cached globally per case, same as steelman.
 */
export async function getOrGenerateBrief(caseId: number): Promise<BriefOutcome> {
  const { db } = await import("@/db");
  const { cases, thinkerAnalyses, sourceCollections } = await import("@/db/schema");

  const [caseRow] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRow) return { status: "case_not_found" };

  if (caseRow.briefContent) {
    return { status: "ok", result: { brief: caseRow.briefContent, cached: true } };
  }

  try {
    const analyses = await db
      .select()
      .from(thinkerAnalyses)
      .where(eq(thinkerAnalyses.caseId, caseId));

    const collections = await db.select().from(sourceCollections);
    const collectionById = new Map(collections.map((c) => [c.id, c]));

    const thinkerBlocks = analyses.map((a) => {
      const collection = collectionById.get(a.collectionId);
      return `${collection?.name ?? "Unknown thinker"}: ${a.summary}`;
    });

    const historicalPassages = await getRelevantPassagesByKind(
      "historical_case",
      caseRow.title,
      6
    );

    const citations: BriefCitation[] = [
      ...analyses.flatMap((a) =>
        a.citedPassages
          .filter((p) => p.documentId !== undefined)
          .map((p) => ({
            documentTitle: p.documentTitle,
            anchorId: p.anchorId,
            documentId: p.documentId!,
          }))
      ),
      ...(caseRow.steelmanCitedPassages ?? [])
        .filter((p) => p.documentId !== undefined)
        .map((p) => ({
          documentTitle: p.documentTitle,
          anchorId: p.anchorId,
          documentId: p.documentId!,
        })),
      ...historicalPassages.map((p) => ({
        documentTitle: p.documentTitle,
        anchorId: p.anchorId,
        documentId: p.documentId,
      })),
    ];

    const system = `You assemble show-prep briefs for "Knives and Spoons," a podcast analyzing SCOTUS/appellate cases through a Lysander Spooner natural law framework. You ONLY organize and connect the cached material given to you into clear prose — you do not invent case facts, holdings, or arguments beyond what's supplied. If a section has no real supporting material, say so plainly rather than fabricating content. Call assemble_brief with your output.`;

    const user = `Case: ${caseRow.title}${caseRow.docketNumber ? ` (No. ${caseRow.docketNumber})` : ""}
Court: ${caseRow.court}
Status: ${caseRow.status}

Cached thinker arguments (${thinkerBlocks.length}):
${thinkerBlocks.length > 0 ? thinkerBlocks.join("\n\n") : "(none generated yet for this case)"}

Steelman the opposition:
${caseRow.steelman ?? "(not generated yet for this case)"}

Historical case law excerpts (may or may not be relevant — judge for yourself):
${
  historicalPassages.length > 0
    ? historicalPassages.map((p) => `From "${p.documentTitle}": ${p.text}`).join("\n\n")
    : "(none retrieved)"
}`;

    const model = modelFor("generateBrief");
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model,
      // Three substantial fields in one forced tool call — 1500 silently
      // truncated mid-call once, dropping the trailing fields with no
      // error (a lenient partial-JSON parser just omitted them). Budget
      // generously and treat any truncation as a hard failure below
      // rather than trusting whatever partial object comes back.
      max_tokens: 4096,
      system,
      tools: [ASSEMBLE_BRIEF_TOOL],
      tool_choice: { type: "tool", name: "assemble_brief" },
      messages: [{ role: "user", content: user }],
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error("Brief generation was truncated (hit max_tokens) — try again");
    }

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Model did not return structured brief output");
    }
    const input = toolUse.input as {
      overview?: string;
      philosophicalAnalysis?: string;
      historicalReview?: string;
    };

    if (!input.overview || !input.philosophicalAnalysis || !input.historicalReview) {
      throw new Error(
        `Model returned incomplete brief output (missing: ${
          [
            !input.overview && "overview",
            !input.philosophicalAnalysis && "philosophicalAnalysis",
            !input.historicalReview && "historicalReview",
          ]
            .filter(Boolean)
            .join(", ")
        })`
      );
    }

    const brief: BriefContent = {
      overview: input.overview,
      philosophicalAnalysis: input.philosophicalAnalysis,
      historicalReview: input.historicalReview,
      citations,
    };

    await db
      .update(cases)
      .set({ briefContent: brief, briefModel: model, briefGeneratedAt: new Date() })
      .where(eq(cases.id, caseId));

    const [finalRow] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);

    return {
      status: "ok",
      result: { brief: finalRow.briefContent ?? brief, cached: false },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "generation_failed", message };
  }
}
