ALTER TABLE "admin_read_chats" DROP CONSTRAINT "admin_read_chats_admin_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_read_chats" ADD CONSTRAINT "admin_read_chats_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;