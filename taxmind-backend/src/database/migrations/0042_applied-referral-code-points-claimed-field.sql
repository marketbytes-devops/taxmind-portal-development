ALTER TABLE "users" ADD COLUMN "remark" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_return_user" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "returned_at" timestamp;