ALTER TABLE "Task" ADD COLUMN "assigneeType" varchar DEFAULT 'user' NOT NULL;
ALTER TABLE "Task" ADD COLUMN "assigneeId" uuid;
ALTER TABLE "Task" ADD COLUMN "sortOrder" integer DEFAULT 0 NOT NULL;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_User_id_fk" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "Subtask" ADD COLUMN "description" text;
ALTER TABLE "Subtask" ADD COLUMN "sortOrder" integer DEFAULT 0 NOT NULL;

CREATE TABLE "TaskComment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "taskId" uuid NOT NULL,
  "authorId" uuid NOT NULL,
  "content" text NOT NULL,
  "isAiGenerated" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "TaskComment_taskId_Task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "TaskComment_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action
);
