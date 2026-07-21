import calendarData from "../../calendar.json";

export type CalendarEventType =
  | "argument"
  | "conference"
  | "order"
  | "opinion"
  | "recess";

export type SeedCalendarEvent = {
  date: string;
  type: Exclude<CalendarEventType, "order">;
  cases?: number[];
  endDate?: string;
  note?: string;
};

export type DerivedCalendarEvent = {
  date: string;
  type: CalendarEventType;
  cases: number[];
  endDate?: string;
  note?: string;
  derived?: boolean;
};

// Federal holidays that shift an order day forward. Extend as terms roll over.
const FEDERAL_HOLIDAYS = new Set([
  "2026-01-01",
  "2026-01-19",
  "2026-02-16",
  "2026-05-25",
  "2026-06-19",
  "2026-07-04",
  "2026-09-07",
  "2026-11-26",
  "2026-12-25",
  "2027-01-01",
  "2027-01-18",
  "2027-02-15",
  "2027-05-31",
  "2027-06-18",
  "2027-07-04",
]);

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function nextBusinessMonday(conferenceDate: string): string {
  const d = new Date(`${conferenceDate}T00:00:00Z`);
  const dayOfWeek = d.getUTCDay(); // 0 Sun ... 5 Fri, 4 Thu
  const daysUntilMonday = ((8 - dayOfWeek) % 7) || 7;
  let orderDate = addDays(conferenceDate, daysUntilMonday);
  // Shift forward a day at a time past any federal holiday.
  while (FEDERAL_HOLIDAYS.has(orderDate)) {
    orderDate = addDays(orderDate, 1);
  }
  return orderDate;
}

const seed = calendarData.events as SeedCalendarEvent[];

/**
 * Full derived calendar: seed events plus one "order" event per conference,
 * per SPEC.md §3 ("Order days are derived: the Monday following each
 * conference day"). Never hand-maintain order days in calendar.json.
 */
export function getCalendarEvents(): DerivedCalendarEvent[] {
  const base: DerivedCalendarEvent[] = seed.map((e) => ({ ...e, cases: e.cases ?? [] }));

  const orderEvents: DerivedCalendarEvent[] = seed
    .filter((e) => e.type === "conference")
    .map((e) => ({
      date: nextBusinessMonday(e.date),
      type: "order",
      cases: [],
      derived: true,
    }));

  return [...base, ...orderEvents].sort((a, b) => a.date.localeCompare(b.date));
}

export function getEventsInRange(startISO: string, endISO: string): DerivedCalendarEvent[] {
  return getCalendarEvents().filter((e) => e.date >= startISO && e.date <= endISO);
}

export function getEventsForWeek(anchorISO: string): DerivedCalendarEvent[] {
  const anchor = new Date(`${anchorISO}T00:00:00Z`);
  const dow = anchor.getUTCDay();
  const monday = addDays(anchorISO, dow === 0 ? -6 : 1 - dow);
  const sunday = addDays(monday, 6);
  return getEventsInRange(monday, sunday);
}
