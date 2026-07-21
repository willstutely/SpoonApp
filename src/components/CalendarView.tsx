import {
  getCalendarEvents,
  getEventsForWeek,
  type DerivedCalendarEvent,
} from "@/lib/calendar";
import { TYPE_STYLE, TYPE_LABEL, formatDay, formatMonth } from "./calendarDisplay";

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
