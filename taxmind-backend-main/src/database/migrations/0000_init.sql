CREATE TYPE "public"."policy_types" AS ENUM('privacy_policy', 'cookies_policy', 'fee_structure', 'terms_and_condition');--> statement-breakpoint
CREATE TYPE "public"."application_statuses" AS ENUM('draft', 'submitted', 'documents_uploaded', 'review', 'processing', 'refund_completed');--> statement-breakpoint
CREATE TYPE "public"."application_document_statuses" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."offline_payment_request_statuses" AS ENUM('pending', 'approved', 'rejected', 'under_review');--> statement-breakpoint
CREATE TYPE "public"."payment_methods" AS ENUM('stripe', 'bank_transfer', 'cash', 'cheque', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_statuses" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."chat_type" AS ENUM('application_based', 'direct');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'file', 'image', 'video', 'audio', 'document');--> statement-breakpoint
CREATE TYPE "public"."sender_type" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."questionnaire_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('text', 'dropdown', 'radio', 'date');--> statement-breakpoint
CREATE TYPE "public"."response_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."action_types" AS ENUM('insert', 'update', 'delete');--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_roleName_unique" UNIQUE("role_name")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "modules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "module_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"permission_name" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_module_permission" UNIQUE("module_id","permission_name")
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_no" integer NOT NULL,
	"type" "policy_types" NOT NULL,
	"content" text NOT NULL,
	"version" varchar(20) NOT NULL,
	"effective_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_module_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"module_permission_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_role_module_permission" UNIQUE("role_id","module_permission_id")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"status" boolean DEFAULT true NOT NULL,
	"email_otp" integer,
	"email_otp_expires" timestamp,
	"email_verified_at" timestamp,
	"is_email_otp_verified" boolean DEFAULT false NOT NULL,
	"role_id" uuid NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hashed_email" text NOT NULL,
	"hashed_phone" text NOT NULL,
	"hashed_pps_number" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"dob" text NOT NULL,
	"profession" text NOT NULL,
	"ppsNumber" text NOT NULL,
	"address" text NOT NULL,
	"eircode" text NOT NULL,
	"maritalStatus" text NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"country" text NOT NULL,
	"zip" text NOT NULL,
	"gender" text NOT NULL,
	"password" text,
	"passwordSetAt" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"emailOtp" text,
	"emailOtpExpires" text,
	"emailVerifiedAt" text,
	"phoneOtp" text,
	"phoneOtpExpires" text,
	"phoneVerifiedAt" text,
	"is_email_otp_verified" boolean DEFAULT false,
	"is_phone_otp_verified" boolean DEFAULT false,
	"status" boolean DEFAULT true NOT NULL,
	"is_email_notification_enabled" boolean DEFAULT true,
	"is_app_notification_enabled" boolean DEFAULT true,
	"lastActivityAt" text,
	"fcmToken" text,
	"is_primary_account" boolean DEFAULT true,
	"is_tax_agent_verification_completed" boolean DEFAULT false,
	"taxAgentVerificationCompletedAt" text,
	"parent_id" uuid NOT NULL,
	"role_id" uuid,
	"deleted_at" timestamp,
	"privacy_policy_id" uuid NOT NULL,
	"privacy_policy_accepted_at" timestamp,
	"cookie_policy_id" uuid NOT NULL,
	"cookie_policy_accepted_at" timestamp,
	"fee_structure_id" uuid NOT NULL,
	"fee_structure_accepted_at" timestamp,
	"terms_and_condition_id" uuid NOT NULL,
	"terms_and_condition_accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	CONSTRAINT "unique_user_role" UNIQUE("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "user_policy_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"policy_id" uuid,
	"accepted_at" timestamp DEFAULT now() NOT NULL,
	"ip" varchar(50),
	"user_agent" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_no" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"refundAmount" text,
	"commissionPercentage" text,
	"commissionAmount" text,
	"promoCode" text,
	"promoCodeDiscountPercentage" text,
	"promoCodeDiscountAmount" text,
	"vatPercentage" text,
	"vatAmount" text,
	"discountAmount" text,
	"totalCommissionAmount" text,
	"is_questionnaire_submitted" boolean DEFAULT true,
	"paymentStatus" text,
	"invoiceId" text,
	"invoice_no" integer,
	"status" "application_statuses" DEFAULT 'draft' NOT NULL,
	"refund_document_id" uuid,
	"refund_document_uploaded_at" timestamp,
	"refund_document_uploaded_by" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "applications_applicationNo_unique" UNIQUE("application_no"),
	CONSTRAINT "applications_invoiceNo_unique" UNIQUE("invoice_no")
);
--> statement-breakpoint
CREATE TABLE "application_status_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"status" "application_statuses" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"rating" text,
	"review" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_document_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "application_document_statuses",
	"admin_id" uuid,
	"application_id" uuid NOT NULL,
	"document_category_id" uuid NOT NULL,
	"is_required" boolean DEFAULT true,
	"note" text,
	"rejectedReason" text,
	"is_additional_document" boolean DEFAULT true,
	"user_uploaded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_document_category_files" (
	"application_document_category_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "application_document_category_files_applicationDocumentCategoryId_fileId_unique" UNIQUE("application_document_category_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" text,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"payment_method" "payment_methods" NOT NULL,
	"status" "payment_statuses" DEFAULT 'pending' NOT NULL,
	"stripePaymentIntentId" text,
	"stripeChargeId" text,
	"stripeCustomerId" text,
	"stripeFee" text,
	"stripeNetAmount" text,
	"description" text,
	"metadata" text,
	"failureReason" text,
	"error_code" text,
	"errorMessage" text,
	"processed_at" timestamp,
	"processed_by" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_applicationId_unique" UNIQUE("application_id")
);
--> statement-breakpoint
CREATE TABLE "offline_payment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"claimedAmount" text,
	"claimed_payment_method" "payment_methods" NOT NULL,
	"claimedTransactionId" text,
	"claimed_payment_date" timestamp,
	"userNotes" text,
	"user_documents" text,
	"status" "offline_payment_request_statuses" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"verifiedAmount" text,
	"verified_payment_method" "payment_methods",
	"verifiedTransactionId" text,
	"verified_payment_date" timestamp,
	"adminNotes" text,
	"rejectionReason" text,
	"rejection_category" text,
	"can_resubmit" boolean DEFAULT false,
	"previous_status" "offline_payment_request_statuses",
	"status_changed_at" timestamp,
	"status_changed_by" uuid,
	"statusChangeReason" text,
	"ipAddress" text,
	"userAgent" text,
	"request_id" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offline_payment_requests_paymentId_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"message_type" "message_type" DEFAULT 'text' NOT NULL,
	"chat_type" "chat_type" NOT NULL,
	"sender_type" "sender_type" NOT NULL,
	"user_id" uuid NOT NULL,
	"admin_id" uuid,
	"application_id" uuid,
	"file_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "admin_read_chats" (
	"chat_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_read_chats_chat_id_admin_id_pk" PRIMARY KEY("chat_id","admin_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" json,
	"notification_type" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notifications" (
	"notification_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp,
	CONSTRAINT "user_notifications_notification_id_user_id_pk" PRIMARY KEY("notification_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user_read_notifications" (
	"notification_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_read_notifications_notification_id_user_id_pk" PRIMARY KEY("notification_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "questionnaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_year" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "questionnaire_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"published_by" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "questionnaires_tax_year_version_unique" UNIQUE("tax_year","version")
);
--> statement-breakpoint
CREATE TABLE "question_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"questionnaire_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"icon" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"questionnaire_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"help_text" text,
	"placeholder" varchar(255),
	"question_type" "question_type" NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"options" jsonb,
	"is_document_required" boolean DEFAULT false,
	"document_category_id" uuid,
	"document_required_for_value" varchar(255),
	"parent_question_id" uuid,
	"show_if_parent_option_value" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaire_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"questionnaire_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"status" "response_status" DEFAULT 'draft' NOT NULL,
	"completion_percentage" integer DEFAULT 0,
	"current_category_id" uuid,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "questionnaire_responses_application_id_questionnaire_id_unique" UNIQUE("application_id","questionnaire_id")
);
--> statement-breakpoint
CREATE TABLE "question_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"questionnaire_response_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"value" text,
	"answered_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "question_responses_questionnaire_response_id_question_id_unique" UNIQUE("questionnaire_response_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"status" boolean DEFAULT true,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_medias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(255),
	"icon" text,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text NOT NULL,
	"description" text NOT NULL,
	"details" text NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_credits_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "carousel_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"template" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "document_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"email" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"category_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_contents" (
	"home_title" text NOT NULL,
	"home_content" text NOT NULL,
	"header_email" varchar(20) NOT NULL,
	"header_phone" varchar(20) NOT NULL,
	"about_us_content" text NOT NULL,
	"commission_percentage" integer NOT NULL,
	"va_percentage" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"image" varchar(500) NOT NULL,
	"image_alt" varchar(255),
	"status" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"author_id" uuid NOT NULL,
	"seo_title" varchar(255),
	"seo_description" text,
	"seo_keywords" text,
	"canonical_url" varchar(500),
	"view_count" varchar(15) DEFAULT '0',
	"reading_time_minutes" varchar(5),
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_order" varchar(5) DEFAULT '0',
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blogs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "action_types",
	"user_id" uuid NOT NULL,
	"details" jsonb,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "action_types",
	"modified_user_id" uuid NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb,
	"modified_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "module_permissions" ADD CONSTRAINT "module_permissions_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_module_permission_id_module_permissions_id_fk" FOREIGN KEY ("module_permission_id") REFERENCES "public"."module_permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_privacy_policy_id_policies_id_fk" FOREIGN KEY ("privacy_policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_cookie_policy_id_policies_id_fk" FOREIGN KEY ("cookie_policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_fee_structure_id_policies_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_terms_and_condition_id_policies_id_fk" FOREIGN KEY ("terms_and_condition_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_policy_acceptances" ADD CONSTRAINT "user_policy_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_policy_acceptances" ADD CONSTRAINT "user_policy_acceptances_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_refund_document_id_files_id_fk" FOREIGN KEY ("refund_document_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_refund_document_uploaded_by_admins_id_fk" FOREIGN KEY ("refund_document_uploaded_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_application_id_users_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_reviews" ADD CONSTRAINT "application_reviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_categories" ADD CONSTRAINT "application_document_categories_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_categories" ADD CONSTRAINT "application_document_categories_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_categories" ADD CONSTRAINT "application_document_categories_document_category_id_document_categories_id_fk" FOREIGN KEY ("document_category_id") REFERENCES "public"."document_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_category_files" ADD CONSTRAINT "application_document_category_files_application_document_category_id_application_document_categories_id_fk" FOREIGN KEY ("application_document_category_id") REFERENCES "public"."application_document_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_category_files" ADD CONSTRAINT "application_document_category_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_processed_by_admins_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD CONSTRAINT "offline_payment_requests_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD CONSTRAINT "offline_payment_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD CONSTRAINT "offline_payment_requests_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD CONSTRAINT "offline_payment_requests_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_payment_requests" ADD CONSTRAINT "offline_payment_requests_status_changed_by_admins_id_fk" FOREIGN KEY ("status_changed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_read_chats" ADD CONSTRAINT "admin_read_chats_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_read_chats" ADD CONSTRAINT "admin_read_chats_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_read_notifications" ADD CONSTRAINT "user_read_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_read_notifications" ADD CONSTRAINT "user_read_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_categories" ADD CONSTRAINT "question_categories_questionnaire_id_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_questionnaire_id_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_question_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."question_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_document_category_id_document_categories_id_fk" FOREIGN KEY ("document_category_id") REFERENCES "public"."document_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_parent_question_id_questions_id_fk" FOREIGN KEY ("parent_question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_questionnaire_id_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_current_category_id_question_categories_id_fk" FOREIGN KEY ("current_category_id") REFERENCES "public"."question_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_questionnaire_response_id_questionnaire_responses_id_fk" FOREIGN KEY ("questionnaire_response_id") REFERENCES "public"."questionnaire_responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queries" ADD CONSTRAINT "queries_category_id_query_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."query_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_modified_user_id_admins_id_fk" FOREIGN KEY ("modified_user_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "modules_name_idx" ON "modules" USING btree ("name");--> statement-breakpoint
CREATE INDEX "modules_is_active_idx" ON "modules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "module_permissions_module_id_idx" ON "module_permissions" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "module_permissions_permission_name_idx" ON "module_permissions" USING btree ("permission_name");--> statement-breakpoint
CREATE UNIQUE INDEX "policies_type_policy_no_index" ON "policies" USING btree ("type","policy_no");--> statement-breakpoint
CREATE UNIQUE INDEX "policies_type_index" ON "policies" USING btree ("type") WHERE "policies"."is_active" = true;--> statement-breakpoint
CREATE INDEX "role_module_permissions_role_id_idx" ON "role_module_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_module_permissions_module_permission_id_idx" ON "role_module_permissions" USING btree ("module_permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admins_email_index" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admins_role_id_index" ON "admins" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_hashed_email_index" ON "users" USING btree ("hashed_email");--> statement-breakpoint
CREATE INDEX "users_hashed_phone_index" ON "users" USING btree ("hashed_phone");--> statement-breakpoint
CREATE INDEX "users_hashed_pps_number_index" ON "users" USING btree ("hashed_pps_number");--> statement-breakpoint
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_policy_acceptances_user_id_index" ON "user_policy_acceptances" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_policy_acceptances_policy_id_index" ON "user_policy_acceptances" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "application_status_histories_application_id_index" ON "application_status_histories" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_notes_admin_id_index" ON "application_notes" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "application_notes_application_id_index" ON "application_notes" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_notes_created_at_index" ON "application_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "application_document_categories_admin_id_index" ON "application_document_categories" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "application_document_categories_application_id_index" ON "application_document_categories" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_document_categories_created_at_index" ON "application_document_categories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "application_document_categories_status_index" ON "application_document_categories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "application_document_category_files_file_id_index" ON "application_document_category_files" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "application_document_category_files_application_document_category_id_index" ON "application_document_category_files" USING btree ("application_document_category_id");--> statement-breakpoint
CREATE INDEX "application_document_category_files_created_at_index" ON "application_document_category_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chats_user_idx" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chats_admin_idx" ON "chats" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "chats_sender_type_idx" ON "chats" USING btree ("sender_type");--> statement-breakpoint
CREATE INDEX "chats_application_idx" ON "chats" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "chats_chat_type_idx" ON "chats" USING btree ("chat_type");--> statement-breakpoint
CREATE INDEX "chats_unread_idx" ON "chats" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "chats_conversation_app_idx" ON "chats" USING btree ("chat_type","application_id");--> statement-breakpoint
CREATE INDEX "chats_conversation_direct_idx" ON "chats" USING btree ("user_id","admin_id");--> statement-breakpoint
CREATE INDEX "chats_created_at_idx" ON "chats" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_read_chats_admin_id_index" ON "admin_read_chats" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_read_chats_chat_id_index" ON "admin_read_chats" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "user_notifications_user_id_index" ON "user_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_notifications_notification_id_index" ON "user_notifications" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "user_read_notifications_user_id_index" ON "user_read_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_read_notifications_notification_id_index" ON "user_read_notifications" USING btree ("notification_id");--> statement-breakpoint
CREATE UNIQUE INDEX "questionnaires_tax_year_index" ON "questionnaires" USING btree ("tax_year") WHERE "questionnaires"."status" = 'published';--> statement-breakpoint
CREATE INDEX "idx_questionnaire_id" ON "question_categories" USING btree ("questionnaire_id");--> statement-breakpoint
CREATE INDEX "question_categories_sort_order_idx" ON "question_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "questions_questionnaire_id_idx" ON "questions" USING btree ("questionnaire_id");--> statement-breakpoint
CREATE INDEX "questions_category_id_idx" ON "questions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "questions_parent_question_id_idx" ON "questions" USING btree ("parent_question_id");--> statement-breakpoint
CREATE INDEX "questions_sort_order_idx" ON "questions" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_user_questionnaire_idx" ON "questionnaire_responses" USING btree ("application_id","questionnaire_id");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_status_idx" ON "questionnaire_responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_submitted_at_idx" ON "questionnaire_responses" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_deleted_at_idx" ON "questionnaire_responses" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "question_responses_questionnaire_response_id_idx" ON "question_responses" USING btree ("questionnaire_response_id");--> statement-breakpoint
CREATE INDEX "question_responses_question_id_idx" ON "question_responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_responses_answered_at_idx" ON "question_responses" USING btree ("answered_at");--> statement-breakpoint
CREATE INDEX "question_responses_deleted_at_idx" ON "question_responses" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "blogs_slug_idx" ON "blogs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blogs_status_idx" ON "blogs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blogs_published_idx" ON "blogs" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "blogs_author_idx" ON "blogs" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blogs_featured_idx" ON "blogs" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "blogs_published_at_idx" ON "blogs" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_index" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_logs_modified_user_id_index" ON "activity_logs" USING btree ("modified_user_id");