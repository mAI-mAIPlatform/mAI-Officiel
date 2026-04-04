CREATE TABLE IF NOT EXISTS "Project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text,
	"instructions" text,
	"memory" text,
	"files" json DEFAULT '[]'::json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Agent" ADD COLUMN "baseModel" varchar DEFAULT 'gpt-4o';--> statement-breakpoint
ALTER TABLE "Agent" ADD COLUMN "tone" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "Agent" ADD COLUMN "conciseness" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "Agent" ADD COLUMN "languageRegister" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "agentId" uuid;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "projectId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_agentId_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
