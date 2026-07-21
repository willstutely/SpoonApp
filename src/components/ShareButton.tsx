"use client";

import { useState } from "react";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share"
      className="shrink-0 rounded-full p-1.5 text-xs text-zinc-500 hover:bg-zinc-800/10 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/10 dark:hover:text-zinc-100"
    >
      {copied ? "Copied" : "Share"}
    </button>
  );
}
