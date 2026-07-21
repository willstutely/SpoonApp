import { getEpisodeSnapshot } from "@/lib/getEpisodeArchive";
import { EpisodeView } from "@/components/EpisodeView";

export default async function ArchiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEpisodeSnapshot(Number(id));

  if (result === "unavailable") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <p className="text-sm text-amber-600 dark:text-amber-500">
          Archive unavailable right now.
        </p>
      </div>
    );
  }

  if (result === "not_found") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <p className="text-sm text-zinc-500">No archived episode with this ID.</p>
      </div>
    );
  }

  const { week, flaggedDevelopments } = result.content;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-2 px-4 py-6">
      <h1 className="text-lg font-semibold">Archived Episode</h1>
      <EpisodeView
        weekMonday={week.weekMonday}
        ordersThisWeek={week.ordersThisWeek}
        opinionsThisWeek={week.opinionsThisWeek}
        argumentsPriorWeek={week.argumentsPriorWeek}
        lookingAhead={week.lookingAhead}
        flaggedDevelopments={flaggedDevelopments}
      />
    </div>
  );
}
