CREATE TABLE "Memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"projectId" uuid,
	"content" text NOT NULL,
	"type" varchar DEFAULT 'manual' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "QuizzlyFriendship" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"friendId" uuid NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "QuizzlyInventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"itemKey" varchar(64) NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "QuizzlyMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"senderId" uuid NOT NULL,
	"receiverId" uuid,
	"text" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "QuizzlyProfile" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"pseudo" varchar(64) DEFAULT 'Player' NOT NULL,
	"bio" text DEFAULT 'Prêt(e) à apprendre en m''amusant 🎯' NOT NULL,
	"avatarDataUrl" text,
	"emoji" varchar(8) DEFAULT '🧠' NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"diamonds" integer DEFAULT 150 NOT NULL,
	"stars" integer DEFAULT 3 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"lastClaimDay" varchar(32) DEFAULT '' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "QuizzlyUserQuest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"questId" varchar(64) NOT NULL,
	"type" varchar NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"plan" varchar(32) DEFAULT 'free' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Subtask" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL,
	"title" text NOT NULL,
	"status" varchar DEFAULT 'todo' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"dueDate" timestamp,
	"status" varchar DEFAULT 'todo' NOT NULL,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"repeatType" varchar DEFAULT 'none' NOT NULL,
	"repeatInterval" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuizzlyFriendship" ADD CONSTRAINT "QuizzlyFriendship_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuizzlyFriendship" ADD CONSTRAINT "QuizzlyFriendship_friendId_User_id_fk" FOREIGN KEY ("friendId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuizzlyInventory" ADD CONSTRAINT "QuizzlyInventory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuizzlyMessage" ADD CONSTRAINT "QuizzlyMessage_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuizzlyMessage" ADD CONSTRAINT "QuizzlyMessage_receiverId_User_id_fk" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuizzlyProfile" ADD CONSTRAINT "QuizzlyProfile_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuizzlyUserQuest" ADD CONSTRAINT "QuizzlyUserQuest_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_taskId_Task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE no action ON UPDATE no action;