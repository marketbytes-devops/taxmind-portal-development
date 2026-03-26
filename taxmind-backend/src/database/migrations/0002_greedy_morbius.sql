ALTER TABLE "applications" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "is_amendment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "question_categories" ADD COLUMN "icon_id" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_parent_id_applications_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_categories" ADD CONSTRAINT "question_categories_icon_id_files_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_categories" DROP COLUMN "icon";