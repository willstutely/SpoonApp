"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function NoteForm({ caseId }: { caseId: number }) {
  const router = useRouter();
  const [timestampLabel, setTimestampLabel] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestampLabel, note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save note");
      }
      setTimestampLabel("");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-2">
      <input
        value={timestampLabel}
        onChange={(e) => setTimestampLabel(e.target.value)}
        placeholder="22:14"
        className="w-20 rounded border border-zinc-800/20 bg-transparent px-2 py-1 text-sm dark:border-zinc-100/20"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Gorsuch question re: standing"
        className="min-w-0 flex-1 rounded border border-zinc-800/20 bg-transparent px-2 py-1 text-sm dark:border-zinc-100/20"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-zinc-800/10 px-3 py-1 text-sm hover:bg-zinc-800/20 disabled:opacity-50 dark:bg-zinc-100/10 dark:hover:bg-zinc-100/20"
      >
        {saving ? "Saving…" : "Add"}
      </button>
      {error && <p className="w-full text-sm text-red-500">{error}</p>}
    </form>
  );
}
