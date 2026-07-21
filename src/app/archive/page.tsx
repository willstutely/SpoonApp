import Link from "next/link";
import { listEpisodeSnapshots } from "@/lib/getEpisodeArchive";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function ArchivePage() {
  const snapshots = await listEpisodeSnapshots();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-lg font-semibold">Episode Archive</h1>

      {snapshots === null ? (
        <p className="text-sm text-amber-600 dark:text-amber-500">
          Archive unavailable right now.
        </p>
      ) : snapshots.length === 0 ? (
        <p className="text-sm text-zinc-500">No archived episodes yet.</p>
      ) : (
        <ul className="space-y-1">
          {snapshots.map((s) => (
            <li key={s.id}>
              <Link href={`/archive/${s.id}`} className="text-sm hover:underline">
                Week of {formatDate(s.episodeDate)}
              </Link>
              {s.briefsGenerated.length > 0 && (
                <span className="ml-2 text-xs text-zinc-500">
                  {s.briefsGenerated.length} brief
                  {s.briefsGenerated.length === 1 ? "" : "s"} generated
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
