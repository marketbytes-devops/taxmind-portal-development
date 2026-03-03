ALTER TABLE "applications" ALTER COLUMN "applicationNo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "hashed_key" text;