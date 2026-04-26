CREATE TABLE "ProjectFile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "taskId" uuid,
  "name" text NOT NULL,
  "blobUrl" text,
  "mimeType" text,
  "size" integer,
  "parentId" uuid,
  "isFolder" boolean DEFAULT false NOT NULL,
  "tags" json DEFAULT '[]'::json NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ProjectFile_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ProjectFile_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "ProjectFile_taskId_Task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "ProjectWebSource" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "url" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "faviconUrl" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ProjectWebSource_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ProjectWebSource_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action
);
