ALTER TABLE "applications" ADD COLUMN "finalAmount" text;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "promoCode";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "promoCodeDiscountPercentage";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "promoCodeDiscountAmount";