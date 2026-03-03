ALTER TABLE "questionnaires" DROP CONSTRAINT "questionnaires_published_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "questionnaires" DROP CONSTRAINT "questionnaires_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_published_by_admins_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;