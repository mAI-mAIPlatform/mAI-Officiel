ALTER TABLE "Project"
ADD COLUMN "aiModel" text,
ADD COLUMN "systemInstructions" text,
ADD COLUMN "notificationSettings" json DEFAULT '{"deadlineReminders":true,"taskAssignment":true,"commentAdded":true,"taskCompleted":true}'::json NOT NULL;
