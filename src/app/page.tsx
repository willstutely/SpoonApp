import { getFeedData } from "@/lib/getFeedData";
import { TIER_ORDER } from "@/lib/sources";
import { FeedTierSection } from "@/components/FeedTierSection";

export default async function Home() {
  const feedData = await getFeedData();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10 px-4 py-6">
      {TIER_ORDER.map((tier) => (
        <FeedTierSection
          key={tier}
          tier={tier}
          sources={feedData.filter((f) => f.source.tier === tier)}
        />
      ))}
    </div>
  );
}
