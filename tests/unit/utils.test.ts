import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { ChatbotError } from "@/lib/errors";
import {
  cn,
  convertToUIMessages,
  fetcher,
  fetchWithErrorHandlers,
  generateUUID,
  getDocumentTimestampByIndex,
  getTextFromMessage,
  sanitizeText,
} from "@/lib/utils";

afterEach(() => {
  mock.restoreAll();
});

test("cn (tailwind-merge + clsx)", () => {
  assert.equal(cn("bg-red-500", "bg-blue-500"), "bg-blue-500");
  assert.equal(
    cn("p-4", { "text-red-500": true, "text-blue-500": false }),
    "p-4 text-red-500"
  );
  assert.equal(
    cn("flex items-center", "flex-col"),
    "flex items-center flex-col"
  );
});

test("generateUUID", () => {
  const numToGenerate = 10_000;
  const uuids = new Set();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  for (let i = 0; i < numToGenerate; i++) {
    const uuid = generateUUID();
    assert.ok(uuidRegex.test(uuid), `Invalid UUID format: ${uuid}`);
    uuids.add(uuid);
  }

  assert.equal(
    uuids.size,
    numToGenerate,
    "Collisions detected in generated UUIDs"
  );
});

test("sanitizeText", () => {
  assert.equal(sanitizeText("Hello <has_function_call>world"), "Hello world");
  assert.equal(
    sanitizeText("No function calls here"),
    "No function calls here"
  );
  assert.equal(
    sanitizeText(
      '{"type":"response.output_text.delta","delta":"Salut"}{"type":"response.output_text.done","text":"Salut final"}'
    ),
    "Salut final"
  );
  assert.equal(
    sanitizeText(
      '{\n  "type": "response.output_text.done",\n  "text": "Texte final avec espaces JSON"\n}'
    ),
    "Texte final avec espaces JSON"
  );
  assert.equal(
    sanitizeText(
      '{"type":"response.completed","response":{"output_text":"Texte depuis response.output_text"}}'
    ),
    "Texte depuis response.output_text"
  );
});

test("getTextFromMessage", () => {
  const mockMessage = {
    id: "1",
    role: "assistant",
    parts: [
      { type: "text", text: "Hello " },
      { type: "tool-invocation", toolInvocation: {} },
      { type: "text", text: "world!" },
    ],
  };
  assert.equal(getTextFromMessage(mockMessage as any), "Hello world!");

  const mockMessageEmpty = {
    id: "2",
    role: "user",
    parts: [{ type: "tool-invocation", toolInvocation: {} }],
  };
  assert.equal(getTextFromMessage(mockMessageEmpty as any), "");

  const mockMessageEmptyParts = {
    id: "3",
    role: "user",
    parts: [],
  };
  assert.equal(getTextFromMessage(mockMessageEmptyParts as any), "");

  const mockMessageEmptyTextStrings = {
    id: "4",
    role: "assistant",
    parts: [
      { type: "text", text: "" },
      { type: "text", text: "Test" },
      { type: "text", text: "" },
    ],
  };
  assert.equal(getTextFromMessage(mockMessageEmptyTextStrings as any), "Test");

  const mockMessageResponseEvents = {
    id: "6",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: '{"type":"response.output_text.delta","delta":"Salut"}{"type":"response.output_text.done","text":"Salut final"}',
      },
    ],
  };
  assert.equal(
    getTextFromMessage(mockMessageResponseEvents as any),
    "Salut final"
  );

  const mockMessageConsecutiveText = {
    id: "5",
    role: "user",
    parts: [
      { type: "text", text: "Part1" },
      { type: "text", text: " " },
      { type: "text", text: "Part2" },
    ],
  };
  assert.equal(
    getTextFromMessage(mockMessageConsecutiveText as any),
    "Part1 Part2"
  );
});

test("getDocumentTimestampByIndex", () => {
  const now = new Date();
  const documents = [
    {
      id: "1",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      title: "Doc 1",
      content: "Content 1",
      kind: "text",
      userId: "1",
    },
    {
      id: "2",
      createdAt: new Date("2024-01-02T00:00:00Z"),
      title: "Doc 2",
      content: "Content 2",
      kind: "text",
      userId: "1",
    },
  ];

  const dt1 = getDocumentTimestampByIndex(documents as any, 0);
  assert.equal(dt1.toISOString(), "2024-01-01T00:00:00.000Z");

  const dt2 = getDocumentTimestampByIndex(documents as any, 1);
  assert.equal(dt2.toISOString(), "2024-01-02T00:00:00.000Z");

  const dtNull = getDocumentTimestampByIndex(null as any, 0);
  assert.ok(Math.abs(dtNull.getTime() - now.getTime()) < 1000);

  const dtOOB = getDocumentTimestampByIndex(documents as any, 5);
  assert.ok(Math.abs(dtOOB.getTime() - now.getTime()) < 1000);
});

test("convertToUIMessages", () => {
  const dbMessages = [
    {
      id: "msg1",
      chatId: "chat1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
      createdAt: new Date("2024-01-01T12:00:00Z"),
    },
    {
      id: "msg2",
      chatId: "chat1",
      role: "assistant",
      parts: [{ type: "text", text: "Hi there" }],
      createdAt: new Date("2024-01-01T12:00:05Z"),
    },
  ];

  const uiMessages = convertToUIMessages(dbMessages as any);
  assert.equal(uiMessages.length, 2);
  assert.equal(uiMessages[0].id, "msg1");
  assert.equal(uiMessages[0].role, "user");
  assert.equal(uiMessages[0].metadata?.createdAt, "2024-01-01T12:00:00Z");
  assert.equal(uiMessages[1].id, "msg2");
  assert.equal(uiMessages[1].role, "assistant");
  assert.equal(uiMessages[1].metadata?.createdAt, "2024-01-01T12:00:05Z");
});

test("fetcher", async (t) => {
  // Test successful fetch
  const mockResponseOk = {
    ok: true,
    json: async () => ({ data: "success" }),
  };
  t.mock.method(global, "fetch", async () => mockResponseOk);

  const result = await fetcher("https://example.com");
  assert.deepEqual(result, { data: "success" });

  // Test error fetch
  const mockResponseErr = {
    ok: false,
    json: async () => ({
      code: "bad_request:api",
      cause: "Something went wrong",
    }),
  };
  t.mock.method(global, "fetch", async () => mockResponseErr);

  try {
    await fetcher("https://example.com");
    assert.fail("Expected fetcher to throw ChatbotError");
  } catch (error: any) {
    if (error.name === "AssertionError") {
      throw error;
    }
    assert.ok(error instanceof ChatbotError);
    assert.equal(error.type, "bad_request");
    assert.equal(error.surface, "api");
    assert.equal(error.cause, "Something went wrong");
  }
});

test("fetchWithErrorHandlers - success", async (t) => {
  const mockResponseOk = {
    ok: true,
    json: async () => ({ data: "success" }),
  };
  t.mock.method(global, "fetch", async () => mockResponseOk);

  const result = await fetchWithErrorHandlers("https://example.com");
  assert.equal(result.ok, true);
});

test("fetchWithErrorHandlers - api error", async (t) => {
  const mockResponseErr = {
    ok: false,
    json: async () => ({ code: "bad_request:api", cause: "Failed" }),
  };
  t.mock.method(global, "fetch", async () => mockResponseErr);

  // ensure we don't accidentally fall into offline error
  const originalNavigator = global.navigator;
  Object.defineProperty(global, "navigator", {
    value: { onLine: true },
    configurable: true,
  });

  try {
    await fetchWithErrorHandlers("https://example.com");
    assert.fail("Expected fetchWithErrorHandlers to throw ChatbotError");
  } catch (error: any) {
    if (error.name === "AssertionError") {
      throw error;
    }
    assert.ok(error instanceof ChatbotError);
    assert.equal(error.type, "bad_request");
    assert.equal(error.surface, "api");
    assert.equal(error.cause, "Failed");
  } finally {
    if (originalNavigator === undefined) {
      // @ts-expect-error
      delete global.navigator;
    } else {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    }
  }
});

test("fetchWithErrorHandlers - network error", async (t) => {
  t.mock.method(global, "fetch", async () => {
    throw new Error("Network error");
  });

  // ensure we don't accidentally fall into offline error
  const originalNavigator = global.navigator;
  Object.defineProperty(global, "navigator", {
    value: { onLine: true },
    configurable: true,
  });

  try {
    await fetchWithErrorHandlers("https://example.com");
    assert.fail("Expected fetchWithErrorHandlers to throw Error");
  } catch (error: any) {
    if (error.name === "AssertionError") {
      throw error;
    }
    assert.ok(!(error instanceof ChatbotError));
    assert.equal(error.message, "Network error");
  } finally {
    if (originalNavigator === undefined) {
      // @ts-expect-error
      delete global.navigator;
    } else {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    }
  }
});

test("fetchWithErrorHandlers - offline error", async (t) => {
  t.mock.method(global, "fetch", async () => {
    throw new TypeError("Failed to fetch"); // Usually how fetch fails when offline
  });

  const originalNavigator = global.navigator;
  Object.defineProperty(global, "navigator", {
    value: { onLine: false },
    configurable: true,
  });

  try {
    await fetchWithErrorHandlers("https://example.com");
    assert.fail("Expected fetchWithErrorHandlers to throw offline error");
  } catch (error: any) {
    if (error.name === "AssertionError") {
      throw error;
    }
    assert.ok(error instanceof ChatbotError);
    assert.equal(error.type, "offline");
    assert.equal(error.surface, "chat");
  } finally {
    if (originalNavigator === undefined) {
      // @ts-expect-error
      delete global.navigator;
    } else {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    }
  }
});

test("fetchWithErrorHandlers - offline error, typeof navigator undefined", async (t) => {
  t.mock.method(global, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });

  const originalNavigator = global.navigator;
  // Make navigator completely undefined to hit the typeof navigator !== 'undefined' check
  delete (global as any).navigator;

  try {
    await fetchWithErrorHandlers("https://example.com");
    assert.fail("Expected fetchWithErrorHandlers to throw original Error");
  } catch (error: any) {
    if (error.name === "AssertionError") {
      throw error;
    }
    assert.ok(!(error instanceof ChatbotError));
    assert.equal(error.message, "Failed to fetch");
  } finally {
    if (originalNavigator !== undefined) {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    }
  }
});

test("fetchWithErrorHandlers - non-ok response throwing non-JSON", async (t) => {
  const mockResponseErr = {
    ok: false,
    json: async () => {
      throw new Error("Invalid JSON");
    },
  };
  t.mock.method(global, "fetch", async () => mockResponseErr);

  const originalNavigator = global.navigator;
  Object.defineProperty(global, "navigator", {
    value: { onLine: true },
    configurable: true,
  });

  try {
    await fetchWithErrorHandlers("https://example.com");
    assert.fail("Expected fetchWithErrorHandlers to throw original Error");
  } catch (error: any) {
    if (error.name === "AssertionError") {
      throw error;
    }
    assert.ok(!(error instanceof ChatbotError));
    assert.equal(error.message, "Invalid JSON");
  } finally {
    if (originalNavigator === undefined) {
      // @ts-expect-error
      delete global.navigator;
    } else {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    }
  }
});
