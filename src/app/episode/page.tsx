import { getEpisodeWeekData, getFlaggedCaseDevelopments } from "@/lib/getEpisodeData";
import { EpisodeView } from "@/components/EpisodeView";

export default async function EpisodePage() {
  const todayISO = new Date().toISOString().slice(0, 10);
  const week = getEpisodeWeekData(todayISO);
  const flaggedDevelopments = await getFlaggedCaseDevelopments();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-2 px-4 py-6">
      <h1 className="text-lg font-semibold">Weekly Episode View</h1>
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
