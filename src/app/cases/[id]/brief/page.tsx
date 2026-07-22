import { getOrGenerateBrief } from "@/lib/generateBrief";
import { getCaseDetail } from "@/lib/getCaseDetail";
import { dedupeCitations, CitationLink } from "@/components/CitationLink";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseId = Number(id);

  const caseResult = await getCaseDetail(caseId);
  if (caseResult.status !== "ok") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <p className="text-sm text-zinc-500">
          {caseResult.status === "not_found" ? "No case found with this ID." : "Unavailable right now."}
        </p>
      </div>
    );
  }

  const outcome = await getOrGenerateBrief(caseId);

  if (outcome.status !== "ok") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <p className="text-sm text-amber-600 dark:text-amber-500">
          {outcome.status === "generation_failed"
            ? `Brief generation failed: ${outcome.message}`
            : "No brief generated yet for this case."}
        </p>
      </div>
    );
  }

  const { brief } = outcome.result;
  const citations = dedupeCitations(brief.citations);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">Show Prep Brief</p>
        <h1 className="text-lg font-semibold">{caseResult.case.title}</h1>
      </div>

      <Section title="Overview">
        <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
          {brief.overview}
        </p>
      </Section>

      <Section title="Philosophical Analysis">
        <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
          {brief.philosophicalAnalysis}
        </p>
      </Section>

      <Section title="Historical Review">
        <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
          {brief.historicalReview}
        </p>
      </Section>

      {citations.length > 0 && (
        <Section title="Citations">
          <ul className="space-y-1">
            {citations.map((c, i) => (
              <li key={i} className="text-sm">
                <CitationLink citation={c} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
