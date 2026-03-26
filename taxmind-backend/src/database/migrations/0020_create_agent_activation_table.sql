CREATE TABLE "agent_activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notice_no" varchar(255) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"regn_trader_no" varchar(255) NOT NULL,
	"document_type" varchar(255) NOT NULL,
	"issued_date" varchar(255) NOT NULL,
	"mandatory_e_filer" varchar(255) NOT NULL,
	"period_begin" varchar(255) DEFAULT 'N/A',
	"tax_type_duty_report" varchar(255) DEFAULT 'N/A',
	"archived_by" varchar(255) DEFAULT 'N/A',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "user_roles" CASCADE;--> statement-breakpoint
DROP TABLE "user_read_notifications" CASCADE;--> statement-breakpoint
DROP TABLE "audit_logs" CASCADE;--> statement-breakpoint
ALTER TABLE "agent_activations" ADD CONSTRAINT "agent_activations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_activations_user_id_index" ON "agent_activations" USING btree ("user_id");