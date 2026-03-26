ALTER TABLE "roles" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "deleted_at" timestamp;