"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SourceRow } from "@/lib/getSources";

const LEAN_LABEL: Record<SourceRow["lean"], string> = {
  liberty: "liberty",
  state_power: "state-power",
  unclassified: "unclassified",
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SourceCard({ source }: { source: SourceRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setLean(lean: SourceRow["lean"]) {
    setBusy(true);
    try {
      await fetch(`/api/sources/${source.id}/lean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lean }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    try {
      await fetch(`/api/sources/${source.id}/confirm`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function poll() {
    setBusy(true);
    try {
      await fetch(`/api/sources/${source.id}/poll`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-zinc-800/10 p-4 dark:border-zinc-100/10">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline"
        >
          {source.name}
        </a>
        {source.pendingReview && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-500">
            pending review
          </span>
        )}
        <select
          value={source.lean}
          disabled={busy}
          onChange={(e) => setLean(e.target.value as SourceRow["lean"])}
          className="rounded-full border-none bg-zinc-800/10 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-100/10 dark:text-zinc-400"
        >
          {(Object.keys(LEAN_LABEL) as SourceRow["lean"][]).map((l) => (
            <option key={l} value={l}>
              {LEAN_LABEL[l]}
            </option>
          ))}
        </select>
        {source.leanOverridden && (
          <span className="text-[11px] text-zinc-500">(human-set)</span>
        )}
      </div>

      {source.summary && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{source.summary}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span>
          {source.lastIngestedAt
            ? `Last ingested ${formatDate(source.lastIngestedAt)}`
            : "Never ingested"}
        </span>
        <button type="button" onClick={poll} disabled={busy} className="underline">
          Poll now
        </button>
        {source.pendingReview && (
          <button type="button" onClick={confirm} disabled={busy} className="underline">
            Confirm
          </button>
        )}
      </div>

      {source.items.length > 0 && (
        <ul className="space-y-1 border-t border-zinc-800/10 pt-2 dark:border-zinc-100/10">
          {source.items.map((item) => (
            <li key={item.id} className="text-sm">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
