import { getCaseDetail } from "@/lib/getCaseDetail";
import { NoteForm } from "@/components/NoteForm";

const COURT_LABEL: Record<string, string> = {
  scotus: "SCOTUS",
  circuit: "Circuit",
  district: "District",
};

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

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCaseDetail(Number(id));

  if (result.status === "unavailable") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <p className="text-sm text-amber-600 dark:text-amber-500">
          Case data unavailable right now.
        </p>
      </div>
    );
  }

  if (result.status === "not_found") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <p className="text-sm text-zinc-500">No case found with this ID.</p>
      </div>
    );
  }

  const { case: c, notes } = result;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-6">
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">{c.title}</h1>
        <div className="flex flex-wrap gap-2 text-xs">
          {c.docketNumber && (
            <span className="rounded-full bg-zinc-800/10 px-2 py-0.5 dark:bg-zinc-100/10">
              No. {c.docketNumber}
            </span>
          )}
          <span className="rounded-full bg-zinc-800/10 px-2 py-0.5 dark:bg-zinc-100/10">
            {COURT_LABEL[c.court] ?? c.court}
          </span>
          <span className="rounded-full bg-zinc-800/10 px-2 py-0.5 capitalize dark:bg-zinc-100/10">
            {c.status.replace(/_/g, " ")}
          </span>
          {c.scotusBound && (
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-blue-600 dark:text-blue-400">
              SCOTUS-bound
            </span>
          )}
        </div>
      </div>

      <Section title="Case Summary">
        <p className="text-sm text-zinc-500">Summary not yet generated.</p>
      </Section>

      <Section title="Court Documents">
        <p className="text-sm text-zinc-500">
          No documents yet — CourtListener/RECAP integration not connected.
        </p>
      </Section>

      <Section title="Case Timeline">
        <p className="text-sm text-zinc-500">No timeline data yet.</p>
      </Section>

      <Section title="Oral Argument">
        <p className="text-sm text-zinc-500">
          No audio/transcript links yet — supremecourt.gov/CourtListener
          integration not connected.
        </p>
        {notes.length === 0 ? (
          <p className="text-sm text-zinc-500">No notes yet.</p>
        ) : (
          <ul className="space-y-1">
            {notes.map((n) => (
              <li key={n.id} className="text-sm">
                <span className="font-mono text-zinc-500">
                  {n.timestampLabel}
                </span>{" "}
                — {n.note}
              </li>
            ))}
          </ul>
        )}
        <NoteForm caseId={c.id} />
      </Section>

      <Section title="People Involved">
        <p className="text-sm text-zinc-500">No people data yet.</p>
      </Section>

      <Section title="Precedent Graph">
        <p className="text-sm text-zinc-500">No citation data yet.</p>
      </Section>
    </div>
  );
}
