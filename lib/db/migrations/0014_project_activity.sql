CREATE TABLE IF NOT EXISTS "ProjectActivity" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "actionType" varchar NOT NULL,
  "targetType" varchar NOT NULL,
  "targetId" uuid,
  "metadata" json DEFAULT '{}'::json NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ProjectActivity_projectId_Project_id_fk"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE cascade,
  CONSTRAINT "ProjectActivity_userId_User_id_fk"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE INDEX IF NOT EXISTS "ProjectActivity_projectId_createdAt_idx"
  ON "ProjectActivity" ("projectId", "createdAt");
