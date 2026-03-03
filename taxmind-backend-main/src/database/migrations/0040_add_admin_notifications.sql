CREATE TABLE "admin_notifications" (
	"notification_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"read_at" timestamp,
	CONSTRAINT "admin_notifications_notification_id_admin_id_pk" PRIMARY KEY("notification_id","admin_id")
);
--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "fcm_token" text;--> statement-breakpoint
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_notifications_admin_id_index" ON "admin_notifications" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_notifications_notification_id_index" ON "admin_notifications" USING btree ("notification_id");