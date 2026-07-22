import type { CLCitationResult } from "@/lib/courtlistener";

function CitationRow({ c }: { c: CLCitationResult }) {
  return (
    <li className="text-sm">
      <a
        href={`https://www.courtlistener.com${c.absolute_url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        {c.caseName}
      </a>
      {c.dateFiled && <span className="text-zinc-500"> ({c.dateFiled.slice(0, 4)})</span>}
    </li>
  );
}

export function PrecedentGraph({
  precedentGraph,
}: {
  precedentGraph: {
    citesCount: number;
    citesSample: CLCitationResult[];
    citedByCount: number;
    citedBySample: CLCitationResult[];
  } | null;
}) {
  if (!precedentGraph) {
    return <p className="text-sm text-zinc-500">No citation data yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-zinc-500">
          Cites {precedentGraph.citesCount} other opinion
          {precedentGraph.citesCount === 1 ? "" : "s"}
          {precedentGraph.citesSample.length > 0 && " — sample:"}
        </p>
        {precedentGraph.citesSample.length > 0 && (
          <ul className="mt-1 space-y-1">
            {precedentGraph.citesSample.map((c, i) => (
              <CitationRow key={i} c={c} />
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500">
          Cited by {precedentGraph.citedByCount} other opinion
          {precedentGraph.citedByCount === 1 ? "" : "s"}
          {precedentGraph.citedBySample.length > 0 && " — sample:"}
        </p>
        {precedentGraph.citedBySample.length > 0 && (
          <ul className="mt-1 space-y-1">
            {precedentGraph.citedBySample.map((c, i) => (
              <CitationRow key={i} c={c} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
