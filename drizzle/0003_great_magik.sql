ALTER TABLE "cases" ADD COLUMN "steelman" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "steelman_cited_passages" jsonb;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "steelman_model" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "steelman_generated_at" timestamp with time zone;