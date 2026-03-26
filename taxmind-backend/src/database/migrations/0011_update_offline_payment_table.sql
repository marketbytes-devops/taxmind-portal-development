ALTER TABLE "offline_payment_requests" DROP CONSTRAINT "offline_payment_requests_paymentId_unique";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP CONSTRAINT "offline_payment_requests_payment_id_payments_id_fk";
--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP CONSTRAINT "offline_payment_requests_status_changed_by_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "claimedAmount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "claimed_payment_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "ipAddress" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "userAgent" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "request_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "stripePaymentIntentId";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "stripeChargeId";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "stripeCustomerId";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "stripeFee";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "stripeNetAmount";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "payment_id";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "claimed_payment_method";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "claimedTransactionId";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "userNotes";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "user_documents";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "verifiedAmount";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "verified_payment_method";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "verifiedTransactionId";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "verified_payment_date";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "adminNotes";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "can_resubmit";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "previous_status";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "status_changed_at";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "status_changed_by";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP COLUMN "statusChangeReason";