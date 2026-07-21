import type { DerivedCalendarEvent } from "@/lib/calendar";
import type { FlaggedCaseDevelopment } from "@/lib/getEpisodeData";
import { TYPE_STYLE, TYPE_LABEL, formatDay } from "./calendarDisplay";

function EventList({ events }: { events: DerivedCalendarEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No activity this week.</p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {events.map((event, i) => (
        <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium ${TYPE_STYLE[event.type]}`}
          >
            {TYPE_LABEL[event.type]}
          </span>
          <span>{formatDay(event.date)}</span>
          {event.note && <span className="text-zinc-500">— {event.note}</span>}
        </li>
      ))}
    </ul>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function EpisodeView({
  weekMonday,
  ordersThisWeek,
  opinionsThisWeek,
  argumentsPriorWeek,
  lookingAhead,
  flaggedDevelopments,
}: {
  weekMonday: string;
  ordersThisWeek: DerivedCalendarEvent[];
  opinionsThisWeek: DerivedCalendarEvent[];
  argumentsPriorWeek: DerivedCalendarEvent[];
  lookingAhead: DerivedCalendarEvent[];
  flaggedDevelopments: FlaggedCaseDevelopment[] | null;
}) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-500">Week of {formatDay(weekMonday)}</p>

      <Section title="Monday Orders">
        <EventList events={ordersThisWeek} />
      </Section>

      <Section title="Opinions Issued">
        <EventList events={opinionsThisWeek} />
      </Section>

      <Section title="Oral Arguments Heard">
        <EventList events={argumentsPriorWeek} />
      </Section>

      <Section title="Developments in Flagged Cases">
        {flaggedDevelopments === null ? (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            Flagged-case data unavailable right now.
          </p>
        ) : flaggedDevelopments.length === 0 ? (
          <p className="text-sm text-zinc-500">No activity this week.</p>
        ) : (
          <ul className="space-y-3">
            {flaggedDevelopments.map((c) => (
              <li key={c.caseId}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  {c.caseTitle}
                  {c.scotusBound && (
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-400">
                      SCOTUS-bound
                    </span>
                  )}
                </div>
                {c.items.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    No activity this week.
                  </p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {c.items.map((item) => (
                      <li key={item.id} className="text-sm">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Looking Ahead">
        <EventList events={lookingAhead} />
      </Section>
    </div>
  );
}
