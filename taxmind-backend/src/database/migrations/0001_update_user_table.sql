ALTER TABLE "users" DROP CONSTRAINT "users_role_id_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."payment_statuses";--> statement-breakpoint
CREATE TYPE "public"."payment_statuses" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."payment_statuses";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE "public"."payment_statuses" USING "status"::"public"."payment_statuses";--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "file_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "file_type" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "file_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "file_size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "passwordSetAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_email_otp_verified" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_phone_otp_verified" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_primary_account" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "parent_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "mime_type" varchar(100);--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "uploaded_by" uuid;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "uploader_type" varchar(10);--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "uploaded_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_signature_consent_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signatureConsentCompletedAt" text;--> statement-breakpoint
ALTER TABLE "social_medias" ADD COLUMN "icon_id" uuid;--> statement-breakpoint
ALTER TABLE "tax_credits" ADD COLUMN "icon_id" uuid;--> statement-breakpoint
ALTER TABLE "carousel_images" ADD COLUMN "image_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "document_templates" ADD COLUMN "template_file_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "image_id" uuid;--> statement-breakpoint
ALTER TABLE "social_medias" ADD CONSTRAINT "social_medias_icon_id_files_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_credits" ADD CONSTRAINT "tax_credits_icon_id_files_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_images" ADD CONSTRAINT "carousel_images_image_id_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_template_file_id_files_id_fk" FOREIGN KEY ("template_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_image_id_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "path";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "street";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "state";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "country";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "zip";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "gender";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role_id";--> statement-breakpoint
ALTER TABLE "social_medias" DROP COLUMN "icon";--> statement-breakpoint
ALTER TABLE "tax_credits" DROP COLUMN "icon";--> statement-breakpoint
ALTER TABLE "carousel_images" DROP COLUMN "path";--> statement-breakpoint
ALTER TABLE "document_templates" DROP COLUMN "template";--> statement-breakpoint
ALTER TABLE "blogs" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_key_unique" UNIQUE("key");