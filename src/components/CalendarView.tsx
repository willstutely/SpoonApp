import {
  getCalendarEvents,
  getEventsForWeek,
  type CalendarEventType,
  type DerivedCalendarEvent,
} from "@/lib/calendar";

const TYPE_STYLE: Record<CalendarEventType, string> = {
  argument:
    "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  conference:
    "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  order: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  opinion: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  recess: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
};

const TYPE_LABEL: Record<CalendarEventType, string> = {
  argument: "Argument",
  conference: "Conference",
  order: "Order",
  opinion: "Opinion",
  recess: "Recess",
};

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatMonth(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function groupByMonth(events: DerivedCalendarEvent[]) {
  const groups = new Map<string, DerivedCalendarEvent[]>();
  for (const event of events) {
    const key = event.date.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function CalendarView({ todayISO }: { todayISO: string }) {
  const events = getCalendarEvents();
  const thisWeek = getEventsForWeek(todayISO);
  const months = groupByMonth(events);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-zinc-800/10 p-4 dark:border-zinc-100/10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          This Week
        </h2>
        {thisWeek.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            No scheduled activity this week.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {thisWeek.map((event, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLE[event.type]}`}
                >
                  {TYPE_LABEL[event.type]}
                </span>
                <span>{formatDay(event.date)}</span>
                {event.note && (
                  <span className="text-zinc-500">— {event.note}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {months.map(([month, monthEvents]) => (
        <section key={month} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {formatMonth(monthEvents[0].date)}
          </h2>
          <ul className="space-y-1.5">
            {monthEvents.map((event, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <span
                  className={`w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium ${TYPE_STYLE[event.type]}`}
                >
                  {TYPE_LABEL[event.type]}
                </span>
                <span className="w-28 shrink-0">{formatDay(event.date)}</span>
                {(event.endDate || event.note) && (
                  <span className="text-zinc-500">
                    {event.type === "recess" && event.endDate && (
                      <>through {formatDay(event.endDate)} </>
                    )}
                    {event.note && `(${event.note})`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
