CREATE TABLE "thinker_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"collection_id" integer NOT NULL,
	"summary" text NOT NULL,
	"cited_passages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thinker_analyses" ADD CONSTRAINT "thinker_analyses_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thinker_analyses" ADD CONSTRAINT "thinker_analyses_collection_id_source_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."source_collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "thinker_analyses_case_collection_idx" ON "thinker_analyses" USING btree ("case_id","collection_id");