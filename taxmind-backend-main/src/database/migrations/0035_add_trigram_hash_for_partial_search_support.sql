DROP INDEX "users_hashed_email_index";--> statement-breakpoint
DROP INDEX "users_hashed_phone_index";--> statement-breakpoint
DROP INDEX "users_hashed_pps_number_index";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_trigram_hashes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_trigram_hashes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name_trigram_hashes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pps_number_trigram_hashes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_email_trigrams" ON "users" USING gin ("email_trigram_hashes");--> statement-breakpoint
CREATE INDEX "idx_phone_trigrams" ON "users" USING gin ("phone_trigram_hashes");--> statement-breakpoint
CREATE INDEX "idx_name_trigrams" ON "users" USING gin ("name_trigram_hashes");--> statement-breakpoint
CREATE INDEX "idx_pps_trigrams" ON "users" USING gin ("pps_number_trigram_hashes");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "hashed_email";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "hashed_phone";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "hashed_pps_number";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "hashed_name";