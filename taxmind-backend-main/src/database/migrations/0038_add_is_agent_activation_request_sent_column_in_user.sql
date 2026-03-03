ALTER TABLE "users" ADD COLUMN "is_tax_agent_verification_request_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "taxAgentVerificationRequestSentAt" text;