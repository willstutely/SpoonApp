/**
 * Single source of truth for Claude model strings, per SPEC.md Model Routing.
 * Verify against https://docs.claude.com before bumping — model IDs go stale.
 */
export const MODELS = {
  cheap: "claude-haiku-4-5-20251001",
  mid: "claude-sonnet-5",
  heavy: "claude-opus-4-8",
} as const;

export type ModelTier = keyof typeof MODELS;

/**
 * Task -> tier mapping from SPEC.md Model Routing table.
 * Hardcoded by task type — no runtime router.
 */
export const TASK_MODEL: Record<string, ModelTier> = {
  feedSummary: "cheap",
  headlineExtraction: "cheap",
  notificationText: "cheap",
  feedHealthCheck: "cheap",
  sourceLeanClassification: "cheap",

  caseSummary: "mid",
  thinkerAnalysis: "mid",
  steelman: "mid",
  generateBrief: "mid",

  // Only switch generateBrief to "heavy" if Sonnet brief quality
  // visibly falls short after real use.
};

export function modelFor(task: keyof typeof TASK_MODEL): string {
  return MODELS[TASK_MODEL[task]];
}
