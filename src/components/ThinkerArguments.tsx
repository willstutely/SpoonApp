import {
  GROUP_LABELS,
  type ThinkerArgumentRow,
  type ThinkerGroup,
} from "@/lib/getThinkerArguments";
import { GenerateThinkerButton } from "./GenerateThinkerButton";

const GROUP_ORDER: ThinkerGroup[] = ["founder", "founders_reading", "historical"];

export function ThinkerArguments({
  caseId,
  thinkers,
}: {
  caseId: number;
  thinkers: ThinkerArgumentRow[] | null;
}) {
  if (thinkers === null) {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-500">
        Thinker arguments unavailable right now.
      </p>
    );
  }

  if (thinkers.length === 0) {
    return <p className="text-sm text-zinc-500">No thinkers ingested yet.</p>;
  }

  return (
    <div className="space-y-6">
      {GROUP_ORDER.map((group) => {
        const inGroup = thinkers.filter((t) => t.group === group);
        if (inGroup.length === 0) return null;

        return (
          <div key={group} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {GROUP_LABELS[group]}
            </h3>
            <div className="space-y-4">
              {inGroup.map((thinker) => (
                <div key={thinker.slug} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{thinker.name}</span>
                    {thinker.isCoreFramework && (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-400">
                        Framework anchor
                      </span>
                    )}
                  </div>
                  {thinker.analysis ? (
                    <>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        {thinker.analysis.summary}
                      </p>
                      {thinker.analysis.citedPassages.length > 0 && (
                        <p className="text-xs text-zinc-500">
                          Sources:{" "}
                          {[
                            ...new Set(
                              thinker.analysis.citedPassages.map((c) => c.documentTitle)
                            ),
                          ].join(", ")}
                        </p>
                      )}
                    </>
                  ) : (
                    <GenerateThinkerButton
                      caseId={caseId}
                      slug={thinker.slug}
                      name={thinker.name}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
