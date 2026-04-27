ALTER TABLE "Project" ADD COLUMN "startDate" timestamp;
ALTER TABLE "Project" ADD COLUMN "endDate" timestamp;
ALTER TABLE "Project" ADD COLUMN "tags" json DEFAULT '[]'::json NOT NULL;
ALTER TABLE "Project" ADD COLUMN "color" varchar(7);
ALTER TABLE "Project" ADD COLUMN "icon" varchar(50);
ALTER TABLE "Project" ADD COLUMN "templateId" uuid;
ALTER TABLE "Project" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;
ALTER TABLE "Project" ADD COLUMN "archivedAt" timestamp;
