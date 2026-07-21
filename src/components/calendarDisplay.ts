import type { CalendarEventType } from "@/lib/calendar";

export const TYPE_STYLE: Record<CalendarEventType, string> = {
  argument: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  conference: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  order: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  opinion: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  recess: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
};

export const TYPE_LABEL: Record<CalendarEventType, string> = {
  argument: "Argument",
  conference: "Conference",
  order: "Order",
  opinion: "Opinion",
  recess: "Recess",
};

export function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatMonth(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
