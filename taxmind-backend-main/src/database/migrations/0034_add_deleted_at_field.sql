ALTER TABLE "application_notes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "application_document_categories" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "agent_activations" ADD COLUMN "deleted_at" timestamp;