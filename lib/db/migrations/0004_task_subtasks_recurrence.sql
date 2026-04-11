ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "repeatType" varchar DEFAULT 'none' NOT NULL;
--> statement-breakpoint
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "repeatInterval" integer;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Subtask" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "taskId" uuid NOT NULL,
  "title" text NOT NULL,
  "status" varchar DEFAULT 'todo' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_taskId_Task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subtask_task_idx" ON "Subtask" ("taskId");
