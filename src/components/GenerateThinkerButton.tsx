"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateThinkerButton({
  caseId,
  slug,
  name,
}: {
  caseId: number;
  slug: string;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/thinkers/${slug}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Generation failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="rounded bg-zinc-800/10 px-3 py-1 text-sm hover:bg-zinc-800/20 disabled:opacity-50 dark:bg-zinc-100/10 dark:hover:bg-zinc-100/20"
      >
        {loading ? "Generating…" : error ? `Retry: ${name}` : `Generate: ${name}`}
      </button>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}
