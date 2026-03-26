ALTER TABLE "chats" ALTER COLUMN "chat_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."chat_type";--> statement-breakpoint
CREATE TYPE "public"."chat_type" AS ENUM('application', 'support');--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "chat_type" SET DATA TYPE "public"."chat_type" USING "chat_type"::"public"."chat_type";