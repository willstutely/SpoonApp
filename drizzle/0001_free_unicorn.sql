CREATE TYPE "public"."document_format" AS ENUM('pdf', 'epub');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('pending', 'extracted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."source_collection_kind" AS ENUM('thinker', 'reference_text', 'historical_case');--> statement-breakpoint
CREATE TYPE "public"."thinker_group" AS ENUM('founder', 'founders_reading', 'historical');--> statement-breakpoint
CREATE TABLE "source_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"kind" "source_collection_kind" NOT NULL,
	"thinker_group" "thinker_group",
	"is_core_framework" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "source_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"title" text NOT NULL,
	"file_path" text NOT NULL,
	"blob_url" text,
	"format" "document_format" NOT NULL,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"extracted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_documents_file_path_unique" UNIQUE("file_path")
);
--> statement-breakpoint
CREATE TABLE "source_passages" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"anchor_id" varchar(32) NOT NULL,
	"ordinal" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_collection_id_source_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."source_collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_passages" ADD CONSTRAINT "source_passages_document_id_source_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."source_documents"("id") ON DELETE no action ON UPDATE no action;