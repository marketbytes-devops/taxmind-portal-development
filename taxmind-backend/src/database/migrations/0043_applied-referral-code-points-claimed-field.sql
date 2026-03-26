ALTER TABLE "users" ADD COLUMN "is_joint_assessment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "is_joint_application" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "is_joint_payment" boolean DEFAULT false NOT NULL;