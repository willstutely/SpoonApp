ALTER TABLE "cases" ADD COLUMN "brief_content" jsonb;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "brief_model" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "brief_generated_at" timestamp with time zone;