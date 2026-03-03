ALTER TABLE "applications" DROP CONSTRAINT "applications_refund_document_id_files_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_refund_document_uploaded_by_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "tax_return_document_id" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "tax_return_document_uploaded_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "tax_return_document_uploaded_by" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_tax_return_document_id_files_id_fk" FOREIGN KEY ("tax_return_document_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_tax_return_document_uploaded_by_admins_id_fk" FOREIGN KEY ("tax_return_document_uploaded_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "refund_document_id";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "refund_document_uploaded_at";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "refund_document_uploaded_by";