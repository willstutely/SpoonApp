/**
 * Ingests the Sources/ primary text library into Postgres: one
 * sourceCollections row per SOURCE_COLLECTIONS entry, one sourceDocuments row
 * per file, chunked into sourcePassages. Idempotent — re-running skips any
 * document already marked 'extracted' unless --force is passed. Never aborts
 * the whole run on a single bad file; failures are recorded per-document and
 * the script continues, printing a summary at the end.
 *
 * Usage: npm run ingest:sources [-- --force]
 *
 * Known limitation: scanned/image-only PDFs with no embedded text layer
 * extract 0 passages (no OCR). They're still marked 'extracted' rather than
 * 'failed' since nothing actually errored — check for documents with zero
 * passages if a source seems to be missing content.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { eq } from "drizzle-orm";

import { SOURCE_COLLECTIONS } from "../src/lib/sourceCollections";
import { extractText } from "../src/lib/ingest/extractText";
import { chunkIntoPassages } from "../src/lib/ingest/chunkText";

const SOURCES_ROOT = join(__dirname, "..", "Sources");
const FORCE = process.argv.includes("--force");

function listFilesRecursive(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue; // .DS_Store etc.
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  // Dynamic import: must happen after dotenv.config() above. A static
  // top-level import of "../src/db" (which throws if DATABASE_URL isn't set
  // yet) would be hoisted above config() and run too early.
  const { db } = await import("../src/db");
  const { sourceCollections, sourceDocuments, sourcePassages } = await import(
    "../src/db/schema"
  );

  async function upsertCollection(seed: (typeof SOURCE_COLLECTIONS)[number]) {
    const [existing] = await db
      .select()
      .from(sourceCollections)
      .where(eq(sourceCollections.slug, seed.slug))
      .limit(1);
    if (existing) return existing;

    const [row] = await db
      .insert(sourceCollections)
      .values({
        slug: seed.slug,
        name: seed.name,
        kind: seed.kind,
        thinkerGroup: seed.thinkerGroup,
        isCoreFramework: seed.isCoreFramework ?? false,
      })
      .returning();
    return row;
  }

  let documentsProcessed = 0;
  let documentsSkipped = 0;
  let documentsFailed = 0;
  let passagesInserted = 0;

  for (const seed of SOURCE_COLLECTIONS) {
    const folderPath = join(SOURCES_ROOT, seed.folder);
    let stat;
    try {
      stat = statSync(folderPath);
    } catch {
      console.warn(`⚠ Skipping "${seed.name}" — folder not found: ${seed.folder}`);
      continue;
    }
    if (!stat.isDirectory()) continue;

    const collection = await upsertCollection(seed);
    const files = listFilesRecursive(folderPath);

    for (const filePath of files) {
      const relativePath = relative(SOURCES_ROOT, filePath);

      const [existing] = await db
        .select()
        .from(sourceDocuments)
        .where(eq(sourceDocuments.filePath, relativePath))
        .limit(1);

      if (existing && existing.status === "extracted" && !FORCE) {
        documentsSkipped += 1;
        continue;
      }

      const title = filePath.split("/").pop() ?? relativePath;
      let docId: number;

      if (existing) {
        docId = existing.id;
      } else {
        const [row] = await db
          .insert(sourceDocuments)
          .values({
            collectionId: collection.id,
            title,
            filePath: relativePath,
            format: "pdf", // placeholder, corrected below once sniffed
            status: "pending",
          })
          .returning();
        docId = row.id;
      }

      try {
        const buffer = readFileSync(filePath);
        const { format, text } = await extractText(buffer);
        const passages = chunkIntoPassages(text);

        if (existing) {
          await db.delete(sourcePassages).where(eq(sourcePassages.documentId, docId));
        }
        if (passages.length > 0) {
          await db.insert(sourcePassages).values(
            passages.map((p) => ({
              documentId: docId,
              anchorId: p.anchorId,
              ordinal: p.ordinal,
              text: p.text,
            }))
          );
        }

        await db
          .update(sourceDocuments)
          .set({ format, status: "extracted", extractedAt: new Date(), errorMessage: null })
          .where(eq(sourceDocuments.id, docId));

        passagesInserted += passages.length;
        documentsProcessed += 1;
        console.log(`✓ ${seed.name}: ${title} (${passages.length} passages)`);
      } catch (err) {
        // Truncate — driver errors can embed the entire failing query's
        // params (seen with a NUL-byte insert: a multi-megabyte message).
        const rawMessage = err instanceof Error ? err.message : String(err);
        const message = rawMessage.slice(0, 500);
        documentsFailed += 1;
        console.error(`✗ ${seed.name}: ${title} — ${message}`);

        // Recovery update in its own try/catch: a second DB error here must
        // not crash the whole run and abandon every remaining file.
        try {
          await db
            .update(sourceDocuments)
            .set({ status: "failed", errorMessage: message })
            .where(eq(sourceDocuments.id, docId));
        } catch (updateErr) {
          console.error(`  (also failed to record failure status: ${updateErr})`);
        }
      }
    }
  }

  console.log("\n--- Ingestion summary ---");
  console.log(`Processed: ${documentsProcessed}`);
  console.log(`Skipped (already extracted): ${documentsSkipped}`);
  console.log(`Failed: ${documentsFailed}`);
  console.log(`Passages inserted: ${passagesInserted}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
