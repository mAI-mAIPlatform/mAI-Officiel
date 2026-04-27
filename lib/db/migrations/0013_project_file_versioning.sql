ALTER TABLE "ProjectFile"
ADD COLUMN "version" integer DEFAULT 1 NOT NULL,
ADD COLUMN "previousVersionId" uuid,
ADD COLUMN "sharedWith" json DEFAULT '[]'::json NOT NULL;

ALTER TABLE "ProjectFile"
ADD CONSTRAINT "ProjectFile_previousVersionId_ProjectFile_id_fk"
FOREIGN KEY ("previousVersionId") REFERENCES "public"."ProjectFile"("id") ON DELETE no action ON UPDATE no action;
