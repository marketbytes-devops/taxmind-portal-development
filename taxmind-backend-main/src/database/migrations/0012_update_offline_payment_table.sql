ALTER TABLE "offline_payment_requests" ADD COLUMN "verified_payment_method" "payment_methods";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD COLUMN "verifiedTransactionId" text;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD COLUMN "verified_payment_date" timestamp;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD COLUMN "rejectedDate" text;