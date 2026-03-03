ALTER TYPE "public"."application_statuses" ADD VALUE 'documents_upload_pending' BEFORE 'documents_uploaded';--> statement-breakpoint
ALTER TYPE "public"."application_statuses" ADD VALUE 'documents_verified' BEFORE 'reviewed';--> statement-breakpoint
ALTER TABLE "user_policy_acceptances" DROP CONSTRAINT "user_policy_acceptances_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP CONSTRAINT "offline_payment_requests_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT "chats_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "whatsapp_chats" DROP CONSTRAINT "whatsapp_chats_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "questionnaire_responses" DROP CONSTRAINT "questionnaire_responses_reviewed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "agent_activations" DROP CONSTRAINT "agent_activations_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_policy_acceptances" ADD CONSTRAINT "user_policy_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD CONSTRAINT "offline_payment_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_chats" ADD CONSTRAINT "whatsapp_chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_activations" ADD CONSTRAINT "agent_activations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;