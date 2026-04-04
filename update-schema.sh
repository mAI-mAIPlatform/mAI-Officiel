cat << 'INNER_EOF' >> lib/db/schema.ts

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
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Agent = InferSelectModel<typeof agent>;
INNER_EOF
