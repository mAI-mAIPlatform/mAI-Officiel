CREATE TABLE "ProjectTemplate" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "defaultInstructions" text,
  "tags" json DEFAULT '[]'::json NOT NULL,
  "taskModels" json DEFAULT '[]'::json NOT NULL,
  "icon" varchar(50),
  "color" varchar(7),
  "isPublic" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ProjectTemplate_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action
);
