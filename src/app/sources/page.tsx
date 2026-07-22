import { getSources } from "@/lib/getSources";
import { AddSourceForm } from "@/components/AddSourceForm";
import { SourceCard } from "@/components/SourceCard";

export default async function SourcesPage() {
  const sources = await getSources();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-lg font-semibold">Sources</h1>
      <AddSourceForm />

      {sources === null ? (
        <p className="text-sm text-amber-600 dark:text-amber-500">
          Sources unavailable right now.
        </p>
      ) : sources.length === 0 ? (
        <p className="text-sm text-zinc-500">No sources added yet.</p>
      ) : (
        <div className="space-y-4">
          {sources.map((s) => (
            <SourceCard key={s.id} source={s} />
          ))}
        </div>
      )}
    </div>
  );
}
