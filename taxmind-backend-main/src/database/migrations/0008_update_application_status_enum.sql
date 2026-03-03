ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
ALTER TABLE "application_status_histories" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."application_statuses";--> statement-breakpoint
CREATE TYPE "public"."application_statuses" AS ENUM('draft', 'submitted', 'documents_uploaded', 'reviewed', 'processing', 'refund_completed');--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."application_statuses";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."application_statuses" USING "status"::"public"."application_statuses";--> statement-breakpoint
ALTER TABLE "application_status_histories" ALTER COLUMN "status" SET DATA TYPE "public"."application_statuses" USING "status"::"public"."application_statuses";--> statement-breakpoint
ALTER TABLE "application_document_categories" DROP COLUMN "user_uploaded_at";