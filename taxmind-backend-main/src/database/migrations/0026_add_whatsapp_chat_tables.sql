CREATE TABLE "whatsapp_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text,
	"message_type" "message_type" DEFAULT 'text' NOT NULL,
	"url" text,
	"media_id" varchar(100),
	"mime_type" varchar(100),
	"file_name" varchar(255),
	"phone" text NOT NULL,
	"hashed_phone" text NOT NULL,
	"sender_type" "sender_type" NOT NULL,
	"user_id" uuid,
	"admin_id" uuid,
	"is_registered" boolean DEFAULT false NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "admin_read_whatsapp_chats" (
	"whatsapp_chat_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_read_whatsapp_chats_whatsapp_chat_id_admin_id_pk" PRIMARY KEY("whatsapp_chat_id","admin_id")
);
--> statement-breakpoint
ALTER TABLE "whatsapp_chats" ADD CONSTRAINT "whatsapp_chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_chats" ADD CONSTRAINT "whatsapp_chats_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_read_whatsapp_chats" ADD CONSTRAINT "admin_read_whatsapp_chats_whatsapp_chat_id_whatsapp_chats_id_fk" FOREIGN KEY ("whatsapp_chat_id") REFERENCES "public"."whatsapp_chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_read_whatsapp_chats" ADD CONSTRAINT "admin_read_whatsapp_chats_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_chats_user_idx" ON "whatsapp_chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "whatsapp_chats_admin_idx" ON "whatsapp_chats" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "whatsapp_chats_sender_type_idx" ON "whatsapp_chats" USING btree ("sender_type");--> statement-breakpoint
CREATE INDEX "whatsapp_chats_unread_idx" ON "whatsapp_chats" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "whatsapp_chats_conversation_direct_idx" ON "whatsapp_chats" USING btree ("user_id","admin_id");--> statement-breakpoint
CREATE INDEX "whatsapp_chats_created_at_idx" ON "whatsapp_chats" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_chats_hashed_phone_idx" ON "whatsapp_chats" USING btree ("hashed_phone");--> statement-breakpoint
CREATE INDEX "admin_read_whatsapp_chats_admin_id_index" ON "admin_read_whatsapp_chats" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_read_whatsapp_chats_whatsapp_chat_id_index" ON "admin_read_whatsapp_chats" USING btree ("whatsapp_chat_id");