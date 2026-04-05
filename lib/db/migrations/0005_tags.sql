CREATE TABLE IF NOT EXISTS "Tag" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL,
  "name" varchar(64) NOT NULL,
  "color" varchar(16) DEFAULT '#60a5fa' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_userId_name_unique" ON "Tag" ("userId", "name");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ChatTag" (
  "chatId" uuid NOT NULL,
  "tagId" uuid NOT NULL,
  CONSTRAINT "ChatTag_chatId_tagId_pk" PRIMARY KEY("chatId", "tagId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatTag" ADD CONSTRAINT "ChatTag_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatTag" ADD CONSTRAINT "ChatTag_tagId_Tag_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
