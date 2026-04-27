import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { ChatbotError } from "../errors";
import { generateUUID } from "../utils";
import {
  type Chat,
  chat,
  type DBMessage,
  document,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

const client = postgres(process.env.POSTGRES_URL ?? "");
export const db = drizzle(client);

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  projectId,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  projectId?: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
      projectId,
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save chat");
  }
}

export async function getChatsByProjectId({
  projectId,
}: {
  projectId: string;
}) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.projectId, projectId))
      .orderBy(desc(chat.createdAt));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get chats by project id"
    );
  }
}

export async function assignChatToProject({
  chatId,
  projectId,
  userId,
}: {
  chatId: string;
  projectId: string;
  userId: string;
}) {
  try {
    return await db
      .update(chat)
      .set({ projectId })
      .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
      .returning();
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to assign chat to project"
    );
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<unknown>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save messages");
  }
}

export async function upsertMessages({ messages }: { messages: DBMessage[] }) {
  if (!messages || messages.length === 0) {
    return;
  }
  try {
    return await db
      .insert(message)
      .values(messages)
      .onConflictDoUpdate({
        target: message.id,
        set: {
          parts: sql`excluded.parts`,
        },
      });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to upsert messages");
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to update message");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function getMessagesByChatIds({ ids }: { ids: string[] }) {
  if (!ids || ids.length === 0) {
    return [];
  }
  try {
    return await db
      .select()
      .from(message)
      .where(inArray(message.chatId, ids))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get messages by chat ids"
    );
  }
}
export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save document");
  }
}

export async function updateDocumentContent({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  try {
    const docs = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))
      .limit(1);

    const latest = docs[0];
    if (!latest) {
      throw new ChatbotError("not_found:database", "Document not found");
    }

    return await db
      .update(document)
      .set({ content })
      .where(and(eq(document.id, id), eq(document.createdAt, latest.createdAt)))
      .returning();
  } catch (_error) {
    if (_error instanceof ChatbotError) {
      throw _error;
    }
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update document content"
    );
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch (_error) {
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const cutoffTime = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, cutoffTime),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}

import {
  type Agent,
  agent,
  type MemoryEntry,
  memoryEntry,
  type Project,
  type ProjectActivity,
  projectActivity,
  type ProjectFile,
  projectFile,
  type ProjectInvitation,
  type ProjectInvitationRole,
  projectInvitation,
  type ProjectMember,
  type ProjectMemberRole,
  projectMember,
  type ProjectNotificationPreference,
  projectNotificationPreference,
  project,
  type ProjectTemplate,
  projectTemplate,
  type ProjectWebSource,
  projectWebSource,
  notification,
  type Notification,
  type Subtask,
  subscription,
  subtask,
  type TaskComment,
  taskComment,
  type Task,
  task,
} from "./schema";

export async function createAgent(
  data: Partial<Agent> & { userId: string; name: string }
) {
  try {
    return await db.insert(agent).values(data).returning();
  } catch (error) {
    console.error("Failed to create agent:", error);
    throw new Error("Failed to create agent");
  }
}

export async function getAgentsByUser(userId: string): Promise<Agent[]> {
  try {
    return await db.select().from(agent).where(eq(agent.userId, userId));
  } catch (error) {
    console.error("Failed to get agents by user:", error);
    throw new Error("Failed to get agents");
  }
}

export async function getAgentById(id: string): Promise<Agent | undefined> {
  try {
    const agents = await db.select().from(agent).where(eq(agent.id, id));
    return agents[0];
  } catch (error) {
    console.error("Failed to get agent by id:", error);
    throw new Error("Failed to get agent");
  }
}

export async function deleteAgent(id: string) {
  try {
    return await db.delete(agent).where(eq(agent.id, id));
  } catch (error) {
    console.error("Failed to delete agent:", error);
    throw new Error("Failed to delete agent");
  }
}

export async function deleteAgentByUser(id: string, userId: string) {
  try {
    return await db
      .delete(agent)
      .where(and(eq(agent.id, id), eq(agent.userId, userId)));
  } catch (error) {
    console.error("Failed to delete agent by user:", error);
    throw new Error("Failed to delete agent");
  }
}

export async function updateAgent(id: string, data: Partial<Agent>) {
  try {
    return await db
      .update(agent)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agent.id, id))
      .returning();
  } catch (error) {
    console.error("Failed to update agent:", error);
    throw new Error("Failed to update agent");
  }
}

export async function updateAgentByUser(
  id: string,
  userId: string,
  data: Partial<Agent>
) {
  try {
    return await db
      .update(agent)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(agent.id, id), eq(agent.userId, userId)))
      .returning();
  } catch (error) {
    console.error("Failed to update agent by user:", error);
    throw new Error("Failed to update agent");
  }
}

export async function createProject(
  data: Partial<Project> & { userId: string; name: string }
) {
  try {
    return await db.insert(project).values(data).returning();
  } catch (error) {
    console.error("Failed to create project:", error);
    throw new Error("Failed to create project");
  }
}

export async function getProjectsByUser(userId: string): Promise<Project[]> {
  try {
    return await db
      .select()
      .from(project)
      .where(eq(project.userId, userId))
      .orderBy(desc(project.createdAt));
  } catch (error) {
    console.error("Failed to get projects by user:", error);
    throw new Error("Failed to get projects");
  }
}

export async function getProjectsForUser(userId: string): Promise<Project[]> {
  try {
    return await db
      .selectDistinct({ project })
      .from(project)
      .leftJoin(
        projectMember,
        and(
          eq(projectMember.projectId, project.id),
          eq(projectMember.userId, userId)
        )
      )
      .where(or(eq(project.userId, userId), eq(projectMember.userId, userId)))
      .orderBy(desc(project.createdAt))
      .then((rows) => rows.map((row) => row.project));
  } catch (error) {
    console.error("Failed to get projects for user:", error);
    throw new Error("Failed to get projects");
  }
}

export async function getProjectsProgressByIds(projectIds: string[]) {
  if (projectIds.length === 0) {
    return {} as Record<string, number>;
  }

  const rows = await db
    .select({
      projectId: task.projectId,
      progress: sql<number>`CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(*) FILTER (WHERE ${task.status} = 'done')::numeric / COUNT(*)::numeric) * 100)::int
      END`,
    })
    .from(task)
    .where(inArray(task.projectId, projectIds))
    .groupBy(task.projectId);

  return Object.fromEntries(
    projectIds.map((id) => [id, rows.find((row) => row.projectId === id)?.progress ?? 0])
  );
}

export async function duplicateProjectForUser(projectId: string, userId: string) {
  const source = await getProjectById(projectId);
  if (!source) {
    return null;
  }

  const [newProject] = await createProject({
    userId,
    name: `${source.name} (copie)`,
    description: source.description,
    instructions: source.instructions,
    aiModel: source.aiModel,
    systemInstructions: source.systemInstructions,
    notificationSettings: source.notificationSettings,
    startDate: source.startDate,
    endDate: source.endDate,
    tags: source.tags ?? [],
    color: source.color,
    icon: source.icon,
  });

  const sourceTasks = await getTasksByProject(source.id);
  const taskIdMap = new Map<string, string>();

  for (const taskItem of sourceTasks) {
    const [copiedTask] = await createTask({
      projectId: newProject.id,
      title: taskItem.title,
      description: taskItem.description,
      dueDate: taskItem.dueDate,
      status: taskItem.status,
      priority: taskItem.priority,
      repeatType: taskItem.repeatType,
      repeatInterval: taskItem.repeatInterval,
      assigneeType: taskItem.assigneeType,
      assigneeId: taskItem.assigneeId,
      sortOrder: taskItem.sortOrder,
    });
    taskIdMap.set(taskItem.id, copiedTask.id);
  }

  for (const [sourceTaskId, copiedTaskId] of taskIdMap.entries()) {
    const sourceSubtasks = await getSubtasksByTask(sourceTaskId);
    for (const sourceSubtask of sourceSubtasks) {
      await createSubtask({
        taskId: copiedTaskId,
        title: sourceSubtask.title,
        description: sourceSubtask.description,
        status: sourceSubtask.status,
      });
    }
  }

  return newProject;
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  try {
    const [projectRecord] = await db
      .select()
      .from(project)
      .where(eq(project.id, id));
    return projectRecord;
  } catch (error) {
    console.error("Failed to get project by id:", error);
    throw new Error("Failed to get project");
  }
}

export type UrgentTaskWidgetItem = {
  id: string;
  title: string;
  dueDate: Date;
  projectId: string;
  projectName: string;
};

export type RecentActivityWidgetItem = {
  id: string;
  projectId: string;
  projectName: string;
  type: "task_created" | "comment_added" | "file_uploaded";
  label: string;
  createdAt: Date;
};

export async function getUrgentTasksForUser(
  userId: string,
  limit = 5
): Promise<UrgentTaskWidgetItem[]> {
  return db.execute(sql<UrgentTaskWidgetItem>`
    SELECT
      t.id,
      t.title,
      t."dueDate",
      p.id AS "projectId",
      p.name AS "projectName"
    FROM "Task" t
    INNER JOIN "Project" p ON p.id = t."projectId"
    LEFT JOIN "ProjectMember" pm
      ON pm."projectId" = p.id
      AND pm."userId" = ${userId}
    WHERE
      t."dueDate" IS NOT NULL
      AND t.status <> 'done'
      AND (p."userId" = ${userId} OR pm."userId" = ${userId})
    ORDER BY t."dueDate" ASC
    LIMIT ${limit}
  `) as unknown as Promise<UrgentTaskWidgetItem[]>;
}

export async function getGlobalProgressForUser(userId: string): Promise<number> {
  const [row] = (await db.execute(sql<{ value: number }>`
    SELECT
      CASE WHEN COUNT(t.id) = 0 THEN 0
      ELSE ROUND((COUNT(t.id) FILTER (WHERE t.status = 'done')::numeric / COUNT(t.id)::numeric) * 100)::int
      END AS value
    FROM "Task" t
    INNER JOIN "Project" p ON p.id = t."projectId"
    LEFT JOIN "ProjectMember" pm
      ON pm."projectId" = p.id
      AND pm."userId" = ${userId}
    WHERE p."archivedAt" IS NULL
      AND (p."userId" = ${userId} OR pm."userId" = ${userId})
  `)) as { value: number }[];

  return row?.value ?? 0;
}

export async function getRecentActivityForUser(
  userId: string,
  limit = 8
): Promise<RecentActivityWidgetItem[]> {
  return db.execute(sql<RecentActivityWidgetItem>`
    SELECT * FROM (
      SELECT
        t.id,
        t."projectId",
        p.name AS "projectName",
        'task_created' AS type,
        t.title AS label,
        t."createdAt"
      FROM "Task" t
      INNER JOIN "Project" p ON p.id = t."projectId"
      LEFT JOIN "ProjectMember" pm ON pm."projectId" = p.id AND pm."userId" = ${userId}
      WHERE (p."userId" = ${userId} OR pm."userId" = ${userId})

      UNION ALL

      SELECT
        tc.id,
        t."projectId",
        p.name AS "projectName",
        'comment_added' AS type,
        LEFT(tc.content, 80) AS label,
        tc."createdAt"
      FROM "TaskComment" tc
      INNER JOIN "Task" t ON t.id = tc."taskId"
      INNER JOIN "Project" p ON p.id = t."projectId"
      LEFT JOIN "ProjectMember" pm ON pm."projectId" = p.id AND pm."userId" = ${userId}
      WHERE (p."userId" = ${userId} OR pm."userId" = ${userId})

      UNION ALL

      SELECT
        pf.id,
        pf."projectId",
        p.name AS "projectName",
        'file_uploaded' AS type,
        pf.name AS label,
        pf."createdAt"
      FROM "ProjectFile" pf
      INNER JOIN "Project" p ON p.id = pf."projectId"
      LEFT JOIN "ProjectMember" pm ON pm."projectId" = p.id AND pm."userId" = ${userId}
      WHERE pf."isFolder" = false
        AND (p."userId" = ${userId} OR pm."userId" = ${userId})
    ) items
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `) as unknown as Promise<RecentActivityWidgetItem[]>;
}

export type ProjectStats = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  progressPercentage: number;
  totalChats: number;
  daysRemaining: number | null;
  totalSubtasks: number;
  completedSubtasks: number;
};

export async function getProjectStatsById(
  projectId: string
): Promise<ProjectStats> {
  try {
    const [stats] = (await db.execute(sql<ProjectStats>`
      SELECT
        COALESCE(task_counts.total_tasks, 0)::int AS "totalTasks",
        COALESCE(task_counts.completed_tasks, 0)::int AS "completedTasks",
        COALESCE(task_counts.in_progress_tasks, 0)::int AS "inProgressTasks",
        COALESCE(task_counts.todo_tasks, 0)::int AS "todoTasks",
        CASE
          WHEN COALESCE(task_counts.total_tasks, 0) = 0 THEN 0
          ELSE ROUND(
            (COALESCE(task_counts.completed_tasks, 0)::numeric / task_counts.total_tasks::numeric) * 100
          )::int
        END AS "progressPercentage",
        COALESCE(chat_counts.total_chats, 0)::int AS "totalChats",
        CASE
          WHEN p."endDate" IS NULL THEN NULL
          ELSE (DATE(p."endDate") - CURRENT_DATE)::int
        END AS "daysRemaining",
        COALESCE(subtask_counts.total_subtasks, 0)::int AS "totalSubtasks",
        COALESCE(subtask_counts.completed_subtasks, 0)::int AS "completedSubtasks"
      FROM "Project" p
      LEFT JOIN (
        SELECT
          t."projectId",
          COUNT(*) AS total_tasks,
          COUNT(*) FILTER (WHERE t.status = 'done') AS completed_tasks,
          COUNT(*) FILTER (WHERE t.status = 'doing') AS in_progress_tasks,
          COUNT(*) FILTER (WHERE t.status = 'todo') AS todo_tasks
        FROM "Task" t
        WHERE t."projectId" = ${projectId}
        GROUP BY t."projectId"
      ) task_counts ON task_counts."projectId" = p.id
      LEFT JOIN (
        SELECT
          c."projectId",
          COUNT(*) AS total_chats
        FROM "Chat" c
        WHERE c."projectId" = ${projectId}
        GROUP BY c."projectId"
      ) chat_counts ON chat_counts."projectId" = p.id
      LEFT JOIN (
        SELECT
          t."projectId",
          COUNT(st.id) AS total_subtasks,
          COUNT(st.id) FILTER (WHERE st.status = 'done') AS completed_subtasks
        FROM "Task" t
        LEFT JOIN "Subtask" st ON st."taskId" = t.id
        WHERE t."projectId" = ${projectId}
        GROUP BY t."projectId"
      ) subtask_counts ON subtask_counts."projectId" = p.id
      WHERE p.id = ${projectId}
      LIMIT 1
    `)) as ProjectStats[];

    return (
      stats ?? {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        progressPercentage: 0,
        totalChats: 0,
        daysRemaining: null,
        totalSubtasks: 0,
        completedSubtasks: 0,
      }
    );
  } catch (error) {
    console.error("Failed to get project stats by id:", error);
    throw new Error("Failed to get project stats");
  }
}

export async function updateProject(id: string, data: Partial<Project>) {
  try {
    return await db
      .update(project)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(project.id, id))
      .returning();
  } catch (error) {
    console.error("Failed to update project:", error);
    throw new Error("Failed to update project");
  }
}

export async function deleteProject(id: string) {
  try {
    return await db.delete(project).where(eq(project.id, id));
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw new Error("Failed to delete project");
  }
}

export function getProjects(userId: string): Promise<Project[]> {
  return getProjectsForUser(userId);
}

export async function getProjectAccess(
  projectId: string,
  userId: string
): Promise<{ role: ProjectMemberRole; isOwner: boolean } | null> {
  const item = await getProjectById(projectId);

  if (!item) {
    return null;
  }

  if (item.userId === userId) {
    return { role: "owner", isOwner: true };
  }

  const [membership] = await db
    .select({ role: projectMember.role })
    .from(projectMember)
    .where(
      and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId))
    )
    .limit(1);

  if (!membership) {
    return null;
  }

  return {
    role: membership.role as ProjectMemberRole,
    isOwner: false,
  };
}

export async function listProjectMembers(projectId: string) {
  const ownerRows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: sql<ProjectMemberRole>`'owner'`,
      acceptedAt: project.createdAt,
    })
    .from(project)
    .innerJoin(user, eq(user.id, project.userId))
    .where(eq(project.id, projectId));

  const memberRows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: projectMember.role,
      acceptedAt: projectMember.acceptedAt,
    })
    .from(projectMember)
    .innerJoin(user, eq(user.id, projectMember.userId))
    .where(eq(projectMember.projectId, projectId));

  return [...ownerRows, ...memberRows];
}

export async function createProjectMember(
  data: Pick<ProjectMember, "projectId" | "userId"> &
    Partial<Pick<ProjectMember, "role" | "invitedByUserId" | "acceptedAt">>
) {
  return db.insert(projectMember).values(data).onConflictDoNothing().returning();
}

export async function updateProjectMemberRole(
  projectId: string,
  memberUserId: string,
  role: ProjectInvitationRole
) {
  return db
    .update(projectMember)
    .set({ role })
    .where(
      and(eq(projectMember.projectId, projectId), eq(projectMember.userId, memberUserId))
    )
    .returning();
}

export async function removeProjectMember(projectId: string, memberUserId: string) {
  return db
    .delete(projectMember)
    .where(
      and(eq(projectMember.projectId, projectId), eq(projectMember.userId, memberUserId))
    )
    .returning();
}

export async function createProjectInvitation(
  data: Pick<
    ProjectInvitation,
    "projectId" | "email" | "role" | "token" | "expiresAt"
  >
) {
  return db.insert(projectInvitation).values(data).returning();
}

export async function listProjectInvitations(projectId: string) {
  return db
    .select()
    .from(projectInvitation)
    .where(eq(projectInvitation.projectId, projectId))
    .orderBy(desc(projectInvitation.createdAt));
}

export async function getProjectInvitationByToken(token: string) {
  const [item] = await db
    .select()
    .from(projectInvitation)
    .where(eq(projectInvitation.token, token))
    .limit(1);
  return item;
}

export async function deleteProjectInvitation(projectId: string, invitationId: string) {
  return db
    .delete(projectInvitation)
    .where(
      and(
        eq(projectInvitation.projectId, projectId),
        eq(projectInvitation.id, invitationId)
      )
    )
    .returning();
}

export async function deleteProjectInvitationByToken(token: string) {
  return db
    .delete(projectInvitation)
    .where(eq(projectInvitation.token, token))
    .returning();
}

export async function updateProjectByUser(
  id: string,
  userId: string,
  data: Partial<Project>
) {
  try {
    return await db
      .update(project)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(project.id, id), eq(project.userId, userId)))
      .returning();
  } catch (error) {
    console.error("Failed to update project by user:", error);
    throw new Error("Failed to update project");
  }
}

export async function deleteProjectByUser(id: string, userId: string) {
  try {
    return await db
      .delete(project)
      .where(and(eq(project.id, id), eq(project.userId, userId)))
      .returning();
  } catch (error) {
    console.error("Failed to delete project by user:", error);
    throw new Error("Failed to delete project");
  }
}

export async function getProjectTemplatesByUserOrPublic(
  userId: string
): Promise<ProjectTemplate[]> {
  try {
    return await db
      .select()
      .from(projectTemplate)
      .where(or(eq(projectTemplate.userId, userId), eq(projectTemplate.isPublic, true)))
      .orderBy(desc(projectTemplate.createdAt));
  } catch (error) {
    console.error("Failed to get project templates:", error);
    throw new Error("Failed to get project templates");
  }
}

export async function getProjectTemplateById(
  id: string
): Promise<ProjectTemplate | undefined> {
  try {
    const [record] = await db
      .select()
      .from(projectTemplate)
      .where(eq(projectTemplate.id, id));
    return record;
  } catch (error) {
    console.error("Failed to get project template by id:", error);
    throw new Error("Failed to get project template");
  }
}

export async function createProjectTemplate(
  data: Pick<ProjectTemplate, "userId" | "name"> &
    Partial<
      Pick<
        ProjectTemplate,
        | "description"
        | "defaultInstructions"
        | "tags"
        | "taskModels"
        | "icon"
        | "color"
        | "isPublic"
      >
    >
) {
  try {
    return await db.insert(projectTemplate).values(data).returning();
  } catch (error) {
    console.error("Failed to create project template:", error);
    throw new Error("Failed to create project template");
  }
}

export async function getProjectNotificationPreference(
  projectId: string,
  userId: string
): Promise<ProjectNotificationPreference | undefined> {
  try {
    const [pref] = await db
      .select()
      .from(projectNotificationPreference)
      .where(
        and(
          eq(projectNotificationPreference.projectId, projectId),
          eq(projectNotificationPreference.userId, userId)
        )
      );
    return pref;
  } catch (error) {
    console.error("Failed to get project notification preference:", error);
    throw new Error("Failed to get project notification preference");
  }
}

export async function upsertProjectNotificationPreference(
  projectId: string,
  userId: string,
  data: Partial<
    Pick<
      ProjectNotificationPreference,
      "deadlineReminders" | "taskAssignment" | "commentAdded" | "taskCompleted"
    >
  >
) {
  try {
    return await db
      .insert(projectNotificationPreference)
      .values({ projectId, userId, ...data })
      .onConflictDoUpdate({
        target: [
          projectNotificationPreference.projectId,
          projectNotificationPreference.userId,
        ],
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
  } catch (error) {
    console.error("Failed to upsert project notification preference:", error);
    throw new Error("Failed to upsert project notification preference");
  }
}

export async function getNotificationsByUser(
  userId: string,
  limit = 50,
  offset = 0
) {
  try {
    return await db
      .select()
      .from(notification)
      .where(eq(notification.userId, userId))
      .orderBy(desc(notification.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("Failed to get notifications:", error);
    throw new Error("Failed to get notifications");
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const [row] = await db
      .select({ count: count(notification.id) })
      .from(notification)
      .where(and(eq(notification.userId, userId), eq(notification.isRead, false)));
    return row?.count ?? 0;
  } catch (error) {
    console.error("Failed to get unread notification count:", error);
    throw new Error("Failed to get unread notification count");
  }
}

export async function createNotification(
  data: Pick<Notification, "userId" | "type" | "title" | "message"> &
    Partial<Pick<Notification, "projectId" | "taskId" | "isRead">>
) {
  try {
    return await db.insert(notification).values(data).returning();
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw new Error("Failed to create notification");
  }
}

export async function markNotificationAsRead(id: string, userId: string) {
  try {
    return await db
      .update(notification)
      .set({ isRead: true })
      .where(and(eq(notification.id, id), eq(notification.userId, userId)))
      .returning();
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await db
      .update(notification)
      .set({ isRead: true })
      .where(eq(notification.userId, userId))
      .returning();
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw new Error("Failed to mark all notifications as read");
  }
}

export async function getProjectFiles(projectId: string) {
  try {
    return await db
      .select()
      .from(projectFile)
      .where(eq(projectFile.projectId, projectId))
      .orderBy(desc(projectFile.isFolder), asc(projectFile.name));
  } catch (error) {
    console.error("Failed to get project files:", error);
    throw new Error("Failed to get project files");
  }
}

export async function createProjectFile(
  data: Pick<ProjectFile, "projectId" | "userId" | "name" | "isFolder"> &
    Partial<
      Pick<
        ProjectFile,
        | "blobUrl"
        | "mimeType"
        | "size"
        | "parentId"
        | "tags"
        | "taskId"
        | "version"
        | "previousVersionId"
        | "sharedWith"
      >
    >
) {
  try {
    return await db.insert(projectFile).values(data).returning();
  } catch (error) {
    console.error("Failed to create project file:", error);
    throw new Error("Failed to create project file");
  }
}

export async function updateProjectFile(
  id: string,
  data: Partial<
    Pick<ProjectFile, "name" | "parentId" | "taskId" | "tags" | "sharedWith">
  >
) {
  try {
    return await db
      .update(projectFile)
      .set(data)
      .where(eq(projectFile.id, id))
      .returning();
  } catch (error) {
    console.error("Failed to update project file:", error);
    throw new Error("Failed to update project file");
  }
}

export async function getLatestProjectFileVersion(
  projectId: string,
  name: string,
  parentId?: string | null
) {
  const parentFilter = parentId
    ? eq(projectFile.parentId, parentId)
    : isNull(projectFile.parentId);
  const [record] = await db
    .select()
    .from(projectFile)
    .where(
      and(
        eq(projectFile.projectId, projectId),
        eq(projectFile.name, name),
        parentFilter,
        eq(projectFile.isFolder, false)
      )
    )
    .orderBy(desc(projectFile.version), desc(projectFile.createdAt))
    .limit(1);
  return record;
}

export async function getProjectFileVersionHistory(fileId: string) {
  const [file] = await db
    .select()
    .from(projectFile)
    .where(eq(projectFile.id, fileId))
    .limit(1);
  if (!file) return [];

  const parentFilter = file.parentId
    ? eq(projectFile.parentId, file.parentId)
    : isNull(projectFile.parentId);

  return db
    .select()
    .from(projectFile)
    .where(
      and(
        eq(projectFile.projectId, file.projectId),
        eq(projectFile.name, file.name),
        parentFilter,
        eq(projectFile.isFolder, false)
      )
    )
    .orderBy(desc(projectFile.version), desc(projectFile.createdAt));
}

export async function getProjectStorageStats(projectId: string) {
  const [stats] = await db
    .select({
      fileCount: count(projectFile.id),
      totalBytes: sql<number>`COALESCE(SUM(${projectFile.size}), 0)`,
    })
    .from(projectFile)
    .where(and(eq(projectFile.projectId, projectId), eq(projectFile.isFolder, false)));

  const quotaBytes = 5 * 1024 * 1024 * 1024;
  const usedBytes = Number(stats?.totalBytes ?? 0);

  return {
    fileCount: Number(stats?.fileCount ?? 0),
    usedBytes,
    quotaBytes,
    usagePercent: Math.min(100, Math.round((usedBytes / quotaBytes) * 100)),
  };
}

export async function deleteProjectFile(id: string) {
  try {
    return await db.delete(projectFile).where(eq(projectFile.id, id)).returning();
  } catch (error) {
    console.error("Failed to delete project file:", error);
    throw new Error("Failed to delete project file");
  }
}

export async function getProjectWebSources(projectId: string) {
  try {
    return await db
      .select()
      .from(projectWebSource)
      .where(eq(projectWebSource.projectId, projectId))
      .orderBy(desc(projectWebSource.createdAt));
  } catch (error) {
    console.error("Failed to get project web sources:", error);
    throw new Error("Failed to get project web sources");
  }
}

export async function createProjectWebSource(
  data: Pick<ProjectWebSource, "projectId" | "userId" | "url" | "title"> &
    Partial<Pick<ProjectWebSource, "description" | "faviconUrl">>
) {
  try {
    return await db.insert(projectWebSource).values(data).returning();
  } catch (error) {
    console.error("Failed to create project web source:", error);
    throw new Error("Failed to create project web source");
  }
}

export async function createProjectActivity(
  data: Pick<
    ProjectActivity,
    "projectId" | "userId" | "actionType" | "targetType"
  > &
    Partial<Pick<ProjectActivity, "targetId" | "metadata">>
) {
  try {
    return await db
      .insert(projectActivity)
      .values({
        ...data,
        metadata: data.metadata ?? {},
      })
      .returning();
  } catch (error) {
    console.error("Failed to create project activity:", error);
    throw new Error("Failed to create project activity");
  }
}

export async function getProjectActivities(
  projectId: string,
  options?: {
    actionType?: ProjectActivity["actionType"];
    userId?: string;
    limit?: number;
    cursor?: string;
  }
) {
  const limit = Math.min(100, Math.max(1, options?.limit ?? 30));
  const conditions = [eq(projectActivity.projectId, projectId)];

  if (options?.actionType) {
    conditions.push(eq(projectActivity.actionType, options.actionType));
  }
  if (options?.userId) {
    conditions.push(eq(projectActivity.userId, options.userId));
  }
  if (options?.cursor) {
    conditions.push(lt(projectActivity.createdAt, new Date(options.cursor)));
  }

  const rows = await db
    .select({
      id: projectActivity.id,
      actionType: projectActivity.actionType,
      targetType: projectActivity.targetType,
      targetId: projectActivity.targetId,
      metadata: projectActivity.metadata,
      createdAt: projectActivity.createdAt,
      userId: projectActivity.userId,
      userName: user.name,
      userImage: user.image,
    })
    .from(projectActivity)
    .innerJoin(user, eq(user.id, projectActivity.userId))
    .where(and(...conditions))
    .orderBy(desc(projectActivity.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore
    ? items.at(-1)?.createdAt?.toISOString() ?? null
    : null;

  return { items, nextCursor };
}

export async function createTask(
  data: Pick<Task, "projectId" | "title"> &
    Partial<Omit<Task, "id" | "projectId" | "title">>
) {
  try {
    return await db.insert(task).values(data).returning();
  } catch (error) {
    console.error("Failed to create task:", error);
    throw new Error("Failed to create task");
  }
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  try {
    return await db
      .select()
      .from(task)
      .where(eq(task.projectId, projectId))
      .orderBy(asc(task.sortOrder), asc(task.dueDate), desc(task.createdAt));
  } catch (error) {
    console.error("Failed to get tasks by project:", error);
    throw new Error("Failed to get tasks");
  }
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  try {
    const [item] = await db.select().from(task).where(eq(task.id, id));
    return item;
  } catch (error) {
    console.error("Failed to get task by id:", error);
    throw new Error("Failed to get task");
  }
}

export async function updateTask(id: string, data: Partial<Task>) {
  try {
    return await db
      .update(task)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(task.id, id))
      .returning();
  } catch (error) {
    console.error("Failed to update task:", error);
    throw new Error("Failed to update task");
  }
}

export async function deleteTask(id: string) {
  try {
    return await db.delete(task).where(eq(task.id, id)).returning();
  } catch (error) {
    console.error("Failed to delete task:", error);
    throw new Error("Failed to delete task");
  }
}

export async function getSubtasksByTask(taskId: string): Promise<Subtask[]> {
  try {
    return await db
      .select()
      .from(subtask)
      .where(eq(subtask.taskId, taskId))
      .orderBy(asc(subtask.sortOrder), asc(subtask.createdAt));
  } catch (error) {
    console.error("Failed to get subtasks by task:", error);
    throw new Error("Failed to get subtasks");
  }
}

export async function getSubtasksByTaskIds(
  taskIds: string[]
): Promise<Subtask[]> {
  if (taskIds.length === 0) {
    return [];
  }

  try {
    return await db
      .select()
      .from(subtask)
      .where(inArray(subtask.taskId, taskIds))
      .orderBy(asc(subtask.sortOrder), asc(subtask.createdAt));
  } catch (error) {
    console.error("Failed to get subtasks by task IDs:", error);
    throw new Error("Failed to get subtasks");
  }
}

export async function createSubtask(
  data: Pick<Subtask, "taskId" | "title"> &
    Partial<Omit<Subtask, "id" | "taskId" | "title">>
) {
  try {
    return await db.insert(subtask).values(data).returning();
  } catch (error) {
    console.error("Failed to create subtask:", error);
    throw new Error("Failed to create subtask");
  }
}

export async function updateSubtask(id: string, data: Partial<Subtask>) {
  try {
    return await db
      .update(subtask)
      .set(data)
      .where(eq(subtask.id, id))
      .returning();
  } catch (error) {
    console.error("Failed to update subtask:", error);
    throw new Error("Failed to update subtask");
  }
}

export async function deleteSubtask(id: string) {
  try {
    return await db.delete(subtask).where(eq(subtask.id, id)).returning();
  } catch (error) {
    console.error("Failed to delete subtask:", error);
    throw new Error("Failed to delete subtask");
  }
}

export async function getTaskCommentsByTaskId(taskId: string) {
  try {
    return await db
      .select({
        id: taskComment.id,
        taskId: taskComment.taskId,
        authorId: taskComment.authorId,
        content: taskComment.content,
        isAiGenerated: taskComment.isAiGenerated,
        createdAt: taskComment.createdAt,
        updatedAt: taskComment.updatedAt,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(taskComment)
      .innerJoin(user, eq(taskComment.authorId, user.id))
      .where(eq(taskComment.taskId, taskId))
      .orderBy(asc(taskComment.createdAt));
  } catch (error) {
    console.error("Failed to get task comments:", error);
    throw new Error("Failed to get task comments");
  }
}

export async function createTaskComment(
  data: Pick<TaskComment, "taskId" | "authorId" | "content"> &
    Partial<Pick<TaskComment, "isAiGenerated">>
) {
  try {
    return await db.insert(taskComment).values(data).returning();
  } catch (error) {
    console.error("Failed to create task comment:", error);
    throw new Error("Failed to create task comment");
  }
}

export async function createMemoryEntry(
  data: Pick<MemoryEntry, "userId" | "content"> &
    Partial<Omit<MemoryEntry, "id" | "userId" | "content">>
) {
  try {
    return await db.insert(memoryEntry).values(data).returning();
  } catch (error) {
    console.error("Failed to create memory entry:", error);
    throw new Error("Failed to create memory entry");
  }
}

export async function getMemoryEntriesByUser(
  userId: string,
  projectId?: string
): Promise<MemoryEntry[]> {
  try {
    return await db
      .select()
      .from(memoryEntry)
      .where(
        projectId
          ? and(
              eq(memoryEntry.userId, userId),
              eq(memoryEntry.projectId, projectId)
            )
          : eq(memoryEntry.userId, userId)
      )
      .orderBy(desc(memoryEntry.createdAt));
  } catch (error) {
    console.error("Failed to get memory entries:", error);
    throw new Error("Failed to get memory entries");
  }
}

export async function updateMemoryEntryByUser(
  id: string,
  userId: string,
  data: Partial<Pick<MemoryEntry, "content" | "projectId" | "type">>
) {
  try {
    return await db
      .update(memoryEntry)
      .set(data)
      .where(and(eq(memoryEntry.id, id), eq(memoryEntry.userId, userId)))
      .returning();
  } catch (error) {
    console.error("Failed to update memory entry:", error);
    throw new Error("Failed to update memory entry");
  }
}

export async function deleteMemoryEntryByUser(id: string, userId: string) {
  try {
    return await db
      .delete(memoryEntry)
      .where(and(eq(memoryEntry.id, id), eq(memoryEntry.userId, userId)))
      .returning();
  } catch (error) {
    console.error("Failed to delete memory entry:", error);
    throw new Error("Failed to delete memory entry");
  }
}

export async function getSubscriptionPlan(userId: string) {
  try {
    const [record] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId));
    return record?.plan ?? "free";
  } catch (error) {
    const pgError = error as
      | { code?: string; message?: string; cause?: { code?: string } }
      | undefined;
    const pgErrorCode = pgError?.code ?? pgError?.cause?.code;
    // Compat DB: certains environnements n'ont pas encore la table "Subscription".
    // On retombe proprement sur "free" sans polluer les logs d'erreurs bloquantes.
    if (pgErrorCode !== "42P01") {
      console.error("Failed to get subscription plan:", error);
    } else {
      console.warn(
        '[Subscription] table "Subscription" introuvable, fallback plan=free.'
      );
    }
    return "free";
  }
}
