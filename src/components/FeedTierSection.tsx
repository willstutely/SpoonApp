import { TIER_LABELS } from "@/lib/sources";
import type { SourceFeedView } from "@/lib/getFeedData";
import { ShareButton } from "./ShareButton";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function FeedTierSection({
  tier,
  sources,
}: {
  tier: keyof typeof TIER_LABELS;
  sources: SourceFeedView[];
}) {
  const isPodcast = tier === "podcast";

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {TIER_LABELS[tier]}
      </h2>
      <div className="space-y-6">
        {sources.map(({ source, items, unavailableSince }) => (
          <div key={source.slug} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {source.name}
              </a>
              {source.lean !== "unclassified" && (
                <span className="shrink-0 rounded-full bg-zinc-800/10 px-2 py-0.5 text-[11px] text-zinc-500 dark:bg-zinc-100/10 dark:text-zinc-400">
                  {source.lean === "liberty" ? "liberty" : "state-power"}
                </span>
              )}
            </div>

            {unavailableSince ? (
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Source unavailable since {formatDate(unavailableSince)}.
              </p>
            ) : items.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                No items ingested yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline"
                      >
                        {item.title}
                      </a>
                      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(item.publishedAt)}
                      </div>
                      {!isPodcast && item.summary && (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                          {item.summary}
                        </p>
                      )}
                    </div>
                    <ShareButton url={item.url} title={item.title} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
