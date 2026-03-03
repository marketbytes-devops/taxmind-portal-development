CREATE TYPE "public"."file_status" AS ENUM('pending', 'active', 'failed', 'deleted');--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "mime_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."file_status";--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "status" SET DATA TYPE "public"."file_status" USING "status"::"public"."file_status";--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "uploaded_at" SET DATA TYPE text;--> statement-breakpoint
CREATE INDEX "idx_files_hashed_key" ON "files" USING btree ("hashed_key");--> statement-breakpoint
CREATE INDEX "idx_files_status" ON "files" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_files_uploaded_by_created" ON "files" USING btree ("uploaded_by","created_at");--> statement-breakpoint
CREATE INDEX "idx_files_file_type" ON "files" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "idx_files_created_at" ON "files" USING btree ("created_at");