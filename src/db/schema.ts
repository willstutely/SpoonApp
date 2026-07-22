import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const courtEnum = pgEnum("court", ["scotus", "circuit", "district"]);

export const caseStatusEnum = pgEnum("case_status", [
  "cert_pending",
  "cert_granted",
  "cert_denied",
  "argued",
  "decided",
  "active",
  "closed",
]);

export const sourceTypeEnum = pgEnum("source_type", ["rss", "api", "scrape"]);

export const sourceLeanEnum = pgEnum("source_lean", [
  "liberty",
  "state_power",
  "unclassified",
]);

export const calendarEventTypeEnum = pgEnum("calendar_event_type", [
  "argument",
  "conference",
  "order",
  "opinion",
  "recess",
]);

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  docketNumber: varchar("docket_number", { length: 32 }),
  courtlistenerId: varchar("courtlistener_id", { length: 64 }),
  title: text("title").notNull(),
  court: courtEnum("court").notNull(),
  status: caseStatusEnum("status").notNull().default("active"),
  scotusBound: boolean("scotus_bound").notNull().default(false),
  flaggedBy: jsonb("flagged_by").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: sourceTypeEnum("type").notNull(),
  url: text("url").notNull(),
  summary: text("summary"),
  lean: sourceLeanEnum("lean").notNull().default("unclassified"),
  leanOverridden: boolean("lean_overridden").notNull().default(false),
  healthThresholdDays: integer("health_threshold_days").notNull().default(7),
  pendingReview: boolean("pending_review").notNull().default(false),
  lastIngestedAt: timestamp("last_ingested_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const feedItems = pgTable("feed_items", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id")
    .notNull()
    .references(() => sources.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ingestedAt: timestamp("ingested_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  summary: text("summary"),
  caseId: integer("case_id").references(() => cases.id),
});

export const episodeSnapshots = pgTable("episode_snapshots", {
  id: serial("id").primaryKey(),
  episodeDate: timestamp("episode_date", { withTimezone: true }).notNull(),
  content: jsonb("content").notNull(),
  briefsGenerated: jsonb("briefs_generated").$type<number[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  type: calendarEventTypeEnum("type").notNull(),
  cases: jsonb("cases").$type<number[]>().notNull().default([]),
});

// Case Detail Page §4: "links + manual timestamped notes" for oral argument
// audio/transcripts. Timestamp-to-audio alignment is deferred (see Future
// Considerations) — timestampLabel is free text like "22:14".
export const oralArgumentNotes = pgTable("oral_argument_notes", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => cases.id),
  timestampLabel: varchar("timestamp_label", { length: 32 }).notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Primary text library ("pundits who may be asked to give their thoughts on
// any given case"): thinkers whose analysis Claude generates on-demand, plus
// collective founding documents and historical case law that aren't a single
// "voice" but are still citable source material. One collection per corpus;
// grouping matches the Case Detail Page §4 thinker sections.
export const sourceCollectionKindEnum = pgEnum("source_collection_kind", [
  "thinker",
  "reference_text",
  "historical_case",
]);

export const thinkerGroupEnum = pgEnum("thinker_group", [
  "founder", // Founder's Corner
  "founders_reading", // What the Founders Were Reading
  "historical", // Historical Thoughts
]);

export const sourceCollections = pgTable("source_collections", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  kind: sourceCollectionKindEnum("kind").notNull(),
  thinkerGroup: thinkerGroupEnum("thinker_group"), // set only when kind = 'thinker'
  // Spooner only — the "gold standard" framework anchor. Downstream
  // retrieval/generation code can weight or prioritize this collection.
  isCoreFramework: boolean("is_core_framework").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const documentFormatEnum = pgEnum("document_format", ["pdf", "epub"]);
export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "extracted",
  "failed",
]);

export const sourceDocuments = pgTable("source_documents", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id")
    .notNull()
    .references(() => sourceCollections.id),
  title: text("title").notNull(),
  // Path relative to Sources/, for idempotent re-ingestion and traceability.
  filePath: text("file_path").notNull().unique(),
  // Filled in once uploaded to Vercel Blob — null until that's wired up.
  blobUrl: text("blob_url"),
  format: documentFormatEnum("format").notNull(),
  status: documentStatusEnum("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  extractedAt: timestamp("extracted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Paragraph-level chunks. anchorId enables the "self-hosted sources" deep
// linking tier from SPEC.md's Generate Brief citation strategy, and the
// passage text itself is what retrieval-grounded generation pulls from.
export const sourcePassages = pgTable("source_passages", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => sourceDocuments.id),
  anchorId: varchar("anchor_id", { length: 32 }).notNull(),
  ordinal: integer("ordinal").notNull(),
  text: text("text").notNull(),
});
