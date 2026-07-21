"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Tap-to-dismiss nav, like an iOS PDF reader: tapping the content area
 * toggles the nav bar; tapping the nav itself never dismisses it.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [navVisible, setNavVisible] = useState(true);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <nav
        className={`sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800/10 bg-background/95 px-4 py-3 backdrop-blur transition-transform duration-200 dark:border-zinc-100/10 ${
          navVisible ? "translate-y-0" : "-translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-5">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Spoon Research
          </Link>
          <Link
            href="/calendar"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Calendar
          </Link>
        </div>
        <ThemeToggle />
      </nav>
      <main
        className="flex-1"
        onClick={() => setNavVisible((v) => !v)}
      >
        {children}
      </main>
    </div>
  );
}
