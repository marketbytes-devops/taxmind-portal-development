ALTER TABLE "users" ADD COLUMN "last_agent_activation_reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "agent_activation_reminder_sent_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "payment_reminder_sent_count" integer DEFAULT 0 NOT NULL;