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
  lt,
  sql,
  type SQL,
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
const db = drizzle(client);

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
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  try {
    return await db
      .select()
      .from(chat)
      .where(and(eq(chat.projectId, projectId), eq(chat.userId, userId)))
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
  if (!messages || messages.length === 0) return;
  try {
    return await db.insert(message).values(messages).onConflictDoUpdate({
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
  if (!ids || ids.length === 0) return [];
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
  project,
  type Subtask,
  subtask,
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
  return getProjectsByUser(userId);
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
      .orderBy(asc(task.dueDate), desc(task.createdAt));
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
      .orderBy(asc(subtask.createdAt));
  } catch (error) {
    console.error("Failed to get subtasks by task:", error);
    throw new Error("Failed to get subtasks");
  }
}

export async function getSubtasksByTaskIds(taskIds: string[]): Promise<Subtask[]> {
  if (taskIds.length === 0) return [];

  try {
    return await db
      .select()
      .from(subtask)
      .where(inArray(subtask.taskId, taskIds))
      .orderBy(asc(subtask.createdAt));
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
    return await db.update(subtask).set(data).where(eq(subtask.id, id)).returning();
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

export async function createMemoryEntry(
  data: Pick<MemoryEntry, "userId" | "content"> &
    Partial<Omit<MemoryEntry, "id" | "userId" | "content">>
) {
  try {
    return await db.insert(memoryEntry).values(data).returning();
  } catch (error) {
    const relationMissing =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "42P01";
    if (relationMissing) {
      console.warn(
        'Memory table is missing ("Memory"): skipping createMemoryEntry until migrations are applied.'
      );
      throw new Error("memory_table_missing");
    }
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
    const relationMissing =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "42P01";
    if (relationMissing) {
      console.warn(
        'Memory table is missing ("Memory"): returning an empty memory list.'
      );
      return [];
    }
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
    const relationMissing =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "42P01";
    if (relationMissing) {
      console.warn(
        'Memory table is missing ("Memory"): skipping updateMemoryEntryByUser.'
      );
      throw new Error("memory_table_missing");
    }
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
    const relationMissing =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "42P01";
    if (relationMissing) {
      console.warn(
        'Memory table is missing ("Memory"): skipping deleteMemoryEntryByUser.'
      );
      throw new Error("memory_table_missing");
    }
    console.error("Failed to delete memory entry:", error);
    throw new Error("Failed to delete memory entry");
  }
}
