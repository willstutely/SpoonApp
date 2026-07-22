import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Lazy singleton — avoids throwing at import time in code paths that never call it. */
export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}
