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
