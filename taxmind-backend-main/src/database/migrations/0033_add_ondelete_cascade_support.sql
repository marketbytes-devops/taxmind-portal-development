ALTER TABLE "application_status_histories" DROP CONSTRAINT "application_status_histories_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "application_notes" DROP CONSTRAINT "application_notes_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "application_reviews" DROP CONSTRAINT "application_reviews_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "application_document_categories" DROP CONSTRAINT "application_document_categories_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "application_document_category_files" DROP CONSTRAINT "application_document_category_files_application_document_category_id_application_document_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "application_document_category_files" DROP CONSTRAINT "application_document_category_files_file_id_files_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP CONSTRAINT "offline_payment_requests_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "offline_payment_requests" DROP CONSTRAINT "offline_payment_requests_payment_id_payments_id_fk";
--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT "chats_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_read_chats" DROP CONSTRAINT "admin_read_chats_chat_id_chats_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_read_whatsapp_chats" DROP CONSTRAINT "admin_read_whatsapp_chats_whatsapp_chat_id_whatsapp_chats_id_fk";
--> statement-breakpoint
ALTER TABLE "questionnaire_responses" DROP CONSTRAINT "questionnaire_responses_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "question_responses" DROP CONSTRAINT "question_responses_questionnaire_response_id_questionnaire_responses_id_fk";
--> statement-breakpoint
ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_reviews" ADD CONSTRAINT "application_reviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_categories" ADD CONSTRAINT "application_document_categories_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_category_files" ADD CONSTRAINT "application_document_category_files_application_document_category_id_application_document_categories_id_fk" FOREIGN KEY ("application_document_category_id") REFERENCES "public"."application_document_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_category_files" ADD CONSTRAINT "application_document_category_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD CONSTRAINT "offline_payment_requests_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD CONSTRAINT "offline_payment_requests_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_read_chats" ADD CONSTRAINT "admin_read_chats_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_read_whatsapp_chats" ADD CONSTRAINT "admin_read_whatsapp_chats_whatsapp_chat_id_whatsapp_chats_id_fk" FOREIGN KEY ("whatsapp_chat_id") REFERENCES "public"."whatsapp_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_questionnaire_response_id_questionnaire_responses_id_fk" FOREIGN KEY ("questionnaire_response_id") REFERENCES "public"."questionnaire_responses"("id") ON DELETE cascade ON UPDATE no action;