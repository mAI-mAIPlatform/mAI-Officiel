CREATE TABLE IF NOT EXISTS "Subscription" (
  "userId" uuid PRIMARY KEY NOT NULL,
  "plan" varchar(32) DEFAULT 'free' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Subscription"
ADD CONSTRAINT "Subscription_userId_User_id_fk"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE no action ON UPDATE no action;
