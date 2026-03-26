ALTER TABLE "payments" DROP CONSTRAINT "payments_processed_by_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."offline_payment_request_statuses";--> statement-breakpoint
CREATE TYPE "public"."offline_payment_request_statuses" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."offline_payment_request_statuses";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "status" SET DATA TYPE "public"."offline_payment_request_statuses" USING "status"::"public"."offline_payment_request_statuses";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payment_method" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "verified_payment_method" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."payment_methods";--> statement-breakpoint
CREATE TYPE "public"."payment_methods" AS ENUM('revolut', 'bank_transfer', 'cash', 'cheque', 'other');--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payment_method" SET DATA TYPE "public"."payment_methods" USING "payment_method"::"public"."payment_methods";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ALTER COLUMN "verified_payment_method" SET DATA TYPE "public"."payment_methods" USING "verified_payment_method"::"public"."payment_methods";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "revolutCustomerId" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "transactionId" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "transactionNo" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD COLUMN "payment_id" uuid;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD CONSTRAINT "offline_payment_requests_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "processed_by";--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD CONSTRAINT "offline_payment_requests_paymentId_unique" UNIQUE("payment_id");