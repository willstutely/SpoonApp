import { CalendarView } from "@/components/CalendarView";

export default function CalendarPage() {
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-2 px-4 py-6">
      <h1 className="text-lg font-semibold">SCOTUS Calendar</h1>
      <CalendarView todayISO={todayISO} />
    </div>
  );
}
