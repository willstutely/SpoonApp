CREATE TYPE "public"."calendar_event_type" AS ENUM('argument', 'conference', 'order', 'opinion', 'recess');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('cert_pending', 'cert_granted', 'cert_denied', 'argued', 'decided', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."court" AS ENUM('scotus', 'circuit', 'district');--> statement-breakpoint
CREATE TYPE "public"."source_lean" AS ENUM('liberty', 'state_power', 'unclassified');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('rss', 'api', 'scrape');--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"type" "calendar_event_type" NOT NULL,
	"cases" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"docket_number" varchar(32),
	"courtlistener_id" varchar(64),
	"title" text NOT NULL,
	"court" "court" NOT NULL,
	"status" "case_status" DEFAULT 'active' NOT NULL,
	"scotus_bound" boolean DEFAULT false NOT NULL,
	"flagged_by" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "episode_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"episode_date" timestamp with time zone NOT NULL,
	"content" jsonb NOT NULL,
	"briefs_generated" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"published_at" timestamp with time zone,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"summary" text,
	"case_id" integer
);
--> statement-breakpoint
CREATE TABLE "oral_argument_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"timestamp_label" varchar(32) NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "source_type" NOT NULL,
	"url" text NOT NULL,
	"summary" text,
	"lean" "source_lean" DEFAULT 'unclassified' NOT NULL,
	"lean_overridden" boolean DEFAULT false NOT NULL,
	"health_threshold_days" integer DEFAULT 7 NOT NULL,
	"pending_review" boolean DEFAULT false NOT NULL,
	"last_ingested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oral_argument_notes" ADD CONSTRAINT "oral_argument_notes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;