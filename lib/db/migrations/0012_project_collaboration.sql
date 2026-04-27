CREATE TABLE "ProjectMember" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "role" varchar(16) DEFAULT 'viewer' NOT NULL,
  "invitedByUserId" uuid,
  "invitedAt" timestamp DEFAULT now() NOT NULL,
  "acceptedAt" timestamp,
  CONSTRAINT "ProjectMember_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ProjectMember_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ProjectMember_invitedByUserId_User_id_fk" FOREIGN KEY ("invitedByUserId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action
);

CREATE UNIQUE INDEX "ProjectMember_project_user_unique" ON "ProjectMember" ("projectId", "userId");

CREATE TABLE "ProjectInvitation" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL,
  "email" varchar(320) NOT NULL,
  "role" varchar(16) DEFAULT 'viewer' NOT NULL,
  "token" varchar(64) NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ProjectInvitation_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ProjectInvitation_token_unique" UNIQUE("token")
);
