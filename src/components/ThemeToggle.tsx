"use client";

import { useState } from "react";

function currentlyLight() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light")
  );
}

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(currentlyLight);

  function toggle() {
    const next = isLight ? "dark" : "light";
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    localStorage.setItem("spoon-theme", next);
    setIsLight(next === "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light/dark mode"
      suppressHydrationWarning
      className="rounded-full p-2 text-sm hover:bg-zinc-800/10 dark:hover:bg-zinc-100/10"
    >
      {isLight ? "🌙" : "☀️"}
    </button>
  );
}
