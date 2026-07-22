"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AddSourceForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to add source");
      }
      setUrl("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add source");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-2">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/feed"
        className="min-w-0 flex-1 rounded border border-zinc-800/20 bg-transparent px-2 py-1 text-sm dark:border-zinc-100/20"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-zinc-800/10 px-3 py-1 text-sm hover:bg-zinc-800/20 disabled:opacity-50 dark:bg-zinc-100/10 dark:hover:bg-zinc-100/20"
      >
        {loading ? "Adding…" : "Add RSS source"}
      </button>
      {error && <p className="w-full text-sm text-red-500">{error}</p>}
    </form>
  );
}
