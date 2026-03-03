CREATE TABLE "agent_activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"noticeNo" text,
	"customerName" text,
	"regnTraderNo" text NOT NULL,
	"documentType" text NOT NULL,
	"issuedDate" text NOT NULL,
	"mandatoryEFiler" text,
	"periodBegin" text,
	"taxTypeDutyReport" text,
	"archivedBy" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_activations" ADD CONSTRAINT "agent_activations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_activations_user_id_index" ON "agent_activations" USING btree ("user_id");