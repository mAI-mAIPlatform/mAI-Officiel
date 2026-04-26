import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  name: text("name"),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  isAnonymous: boolean("isAnonymous").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  agentId: uuid("agentId").references(() => agent.id),
  projectId: uuid("projectId").references(() => project.id),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  })
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const agent = pgTable("Agent", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("systemPrompt"),
  memory: text("memory"), // plain text knowledge
  files: json("files").default([]), // uploaded files metadata
  image: text("image"), // logo url
  baseModel: varchar("baseModel").default("gpt-4o"),
  tone: integer("tone").default(50),
  conciseness: integer("conciseness").default(50),
  languageRegister: integer("languageRegister").default(50),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Agent = InferSelectModel<typeof agent>;

export const project = pgTable("Project", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  instructions: text("instructions"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  tags: json("tags").$type<string[]>().notNull().default([]),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  templateId: uuid("templateId"),
  pinned: boolean("pinned").notNull().default(false),
  archivedAt: timestamp("archivedAt"),
  memory: text("memory"), // plain text knowledge/sources
  files: json("files").default([]), // uploaded files metadata
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Project = InferSelectModel<typeof project>;

export type ProjectTemplateTaskModel = {
  title: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  subtasks: string[];
};

export const projectTemplate = pgTable("ProjectTemplate", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  description: text("description"),
  defaultInstructions: text("defaultInstructions"),
  tags: json("tags").$type<string[]>().notNull().default([]),
  taskModels: json("taskModels")
    .$type<ProjectTemplateTaskModel[]>()
    .notNull()
    .default([]),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 7 }),
  isPublic: boolean("isPublic").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ProjectTemplate = InferSelectModel<typeof projectTemplate>;

export const task = pgTable("Task", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  status: varchar("status", { enum: ["todo", "doing", "done"] })
    .notNull()
    .default("todo"),
  priority: varchar("priority", { enum: ["low", "medium", "high"] })
    .notNull()
    .default("medium"),
  repeatType: varchar("repeatType", {
    enum: ["none", "daily", "weekly", "monthly", "custom"],
  })
    .notNull()
    .default("none"),
  repeatInterval: integer("repeatInterval"),
  assigneeType: varchar("assigneeType", { enum: ["user", "ai"] })
    .notNull()
    .default("user"),
  assigneeId: uuid("assigneeId").references(() => user.id),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Task = InferSelectModel<typeof task>;

export const subtask = pgTable("Subtask", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  taskId: uuid("taskId")
    .notNull()
    .references(() => task.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["todo", "done"] })
    .notNull()
    .default("todo"),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Subtask = InferSelectModel<typeof subtask>;

export const taskComment = pgTable("TaskComment", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  taskId: uuid("taskId")
    .notNull()
    .references(() => task.id, { onDelete: "cascade" }),
  authorId: uuid("authorId")
    .notNull()
    .references(() => user.id),
  content: text("content").notNull(),
  isAiGenerated: boolean("isAiGenerated").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type TaskComment = InferSelectModel<typeof taskComment>;

export const notification = pgTable("Notification", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  projectId: uuid("projectId").references(() => project.id),
  taskId: uuid("taskId").references(() => task.id),
  type: varchar("type", {
    enum: [
      "task_due",
      "task_assigned",
      "comment_added",
      "project_deadline",
      "task_completed",
      "mention",
    ],
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Notification = InferSelectModel<typeof notification>;

export const projectNotificationPreference = pgTable(
  "ProjectNotificationPreference",
  {
    projectId: uuid("projectId")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    deadlineReminders: boolean("deadlineReminders").notNull().default(true),
    taskAssignment: boolean("taskAssignment").notNull().default(true),
    commentAdded: boolean("commentAdded").notNull().default(true),
    taskCompleted: boolean("taskCompleted").notNull().default(true),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectId, table.userId] }),
  })
);

export type ProjectNotificationPreference = InferSelectModel<
  typeof projectNotificationPreference
>;

export const projectFile = pgTable("ProjectFile", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  taskId: uuid("taskId").references(() => task.id),
  name: text("name").notNull(),
  blobUrl: text("blobUrl"),
  mimeType: text("mimeType"),
  size: integer("size"),
  parentId: uuid("parentId"),
  isFolder: boolean("isFolder").notNull().default(false),
  tags: json("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ProjectFile = InferSelectModel<typeof projectFile>;

export const projectWebSource = pgTable("ProjectWebSource", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  faviconUrl: text("faviconUrl"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ProjectWebSource = InferSelectModel<typeof projectWebSource>;

export const memoryEntry = pgTable("Memory", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  projectId: uuid("projectId").references(() => project.id),
  content: text("content").notNull(),
  type: varchar("type", { enum: ["auto", "manual"] })
    .notNull()
    .default("manual"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type MemoryEntry = InferSelectModel<typeof memoryEntry>;

export const subscription = pgTable("Subscription", {
  userId: uuid("userId")
    .primaryKey()
    .references(() => user.id),
  plan: varchar("plan", { length: 32 }).notNull().default("free"),
});

export type Subscription = InferSelectModel<typeof subscription>;

// --- QUIZZLY TABLES ---

export const quizzlyProfile = pgTable("QuizzlyProfile", {
  userId: uuid("userId")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  pseudo: varchar("pseudo", { length: 64 }).notNull().default("Player"),
  bio: text("bio").notNull().default("Prêt(e) à apprendre en m'amusant 🎯"),
  avatarDataUrl: text("avatarDataUrl"),
  emoji: varchar("emoji", { length: 8 }).notNull().default("🧠"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  diamonds: integer("diamonds").notNull().default(150),
  stars: integer("stars").notNull().default(3),
  streak: integer("streak").notNull().default(0),
  lastClaimDay: varchar("lastClaimDay", { length: 32 }).notNull().default(""),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type QuizzlyProfile = InferSelectModel<typeof quizzlyProfile>;

export const quizzlyInventory = pgTable("QuizzlyInventory", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  itemKey: varchar("itemKey", { length: 64 }).notNull(), // e.g. "booster_x1.5", "booster_x2"
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type QuizzlyInventory = InferSelectModel<typeof quizzlyInventory>;

export const quizzlyUserQuest = pgTable("QuizzlyUserQuest", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  questId: varchar("questId", { length: 64 }).notNull(), // ref to daily/weekly JSON quest id
  type: varchar("type", { enum: ["daily", "weekly"] }).notNull(),
  progress: integer("progress").notNull().default(0),
  isCompleted: boolean("isCompleted").notNull().default(false),
  assignedAt: timestamp("assignedAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type QuizzlyUserQuest = InferSelectModel<typeof quizzlyUserQuest>;

export const quizzlyFriendship = pgTable("QuizzlyFriendship", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  friendId: uuid("friendId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: varchar("status", { enum: ["pending", "accepted"] }).notNull().default("pending"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type QuizzlyFriendship = InferSelectModel<typeof quizzlyFriendship>;

export const quizzlyMessage = pgTable("QuizzlyMessage", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  senderId: uuid("senderId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  receiverId: uuid("receiverId") // null for global/tribe chat, or specific user for DM
    .references(() => user.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type QuizzlyMessage = InferSelectModel<typeof quizzlyMessage>;
