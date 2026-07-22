import { getSourceDocument } from "@/lib/getSourceDocument";

export default async function SourceDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSourceDocument(Number(id));

  if (result.status === "unavailable") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <p className="text-sm text-amber-600 dark:text-amber-500">
          Document unavailable right now.
        </p>
      </div>
    );
  }

  if (result.status === "not_found") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <p className="text-sm text-zinc-500">No document found with this ID.</p>
      </div>
    );
  }

  const { document: doc } = result;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">{doc.collectionName}</p>
        <h1 className="text-lg font-semibold">{doc.title}</h1>
      </div>

      {doc.passages.length === 0 ? (
        <p className="text-sm text-zinc-500">No extracted text for this document.</p>
      ) : (
        <div className="space-y-3">
          {doc.passages.map((p) => (
            <p
              key={p.anchorId}
              id={p.anchorId}
              className="scroll-mt-20 text-sm leading-relaxed target:rounded target:bg-amber-500/15 target:px-2 target:py-1"
            >
              {p.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
