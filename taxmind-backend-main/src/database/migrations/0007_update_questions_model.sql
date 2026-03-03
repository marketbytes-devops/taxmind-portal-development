ALTER TABLE "application_status_histories" DROP CONSTRAINT "application_status_histories_application_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT "questions_document_category_id_document_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "is_document_required";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "document_category_id";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "document_required_for_value";