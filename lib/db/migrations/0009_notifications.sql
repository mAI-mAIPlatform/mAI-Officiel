CREATE TABLE "Notification" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL,
  "projectId" uuid,
  "taskId" uuid,
  "type" varchar NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "isRead" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "Notification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "Notification_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "Notification_taskId_Task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "ProjectNotificationPreference" (
  "projectId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "deadlineReminders" boolean DEFAULT true NOT NULL,
  "taskAssignment" boolean DEFAULT true NOT NULL,
  "commentAdded" boolean DEFAULT true NOT NULL,
  "taskCompleted" boolean DEFAULT true NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ProjectNotificationPreference_projectId_userId_pk" PRIMARY KEY("projectId","userId"),
  CONSTRAINT "ProjectNotificationPreference_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ProjectNotificationPreference_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action
);
