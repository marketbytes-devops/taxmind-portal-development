ALTER TABLE "applications" DROP CONSTRAINT "applications_applicationNo_unique";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "applicationNo" text;--> statement-breakpoint
CREATE INDEX "applications_user_id_idx" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "applications_user_created_idx" ON "applications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "applications_user_year_status_idx" ON "applications" USING btree ("user_id","year","status");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_year_idx" ON "applications" USING btree ("year");--> statement-breakpoint
CREATE INDEX "applications_application_no_idx" ON "applications" USING btree ("applicationNo");--> statement-breakpoint
CREATE INDEX "applications_parent_id_idx" ON "applications" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "applications_created_at_idx" ON "applications" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "application_no";