import assert from "node:assert/strict";
import { test } from "node:test";
import { interpolateTemplate } from "@/lib/notifications";

test("interpolateTemplate - basic variable replacement", () => {
  const result = interpolateTemplate("Hello {{name}}!", { name: "World" });
  assert.equal(result, "Hello World!");
});

test("interpolateTemplate - multiple variables", () => {
  const result = interpolateTemplate("{{greeting}}, {{name}}! Welcome to {{place}}.", {
    greeting: "Hello",
    name: "Alice",
    place: "Wonderland"
  });
  assert.equal(result, "Hello, Alice! Welcome to Wonderland.");
});

test("interpolateTemplate - various data types", () => {
  const result = interpolateTemplate(
    "Num: {{num}}, BoolTrue: {{boolTrue}}, BoolFalse: {{boolFalse}}, Zero: {{zero}}",
    {
      num: 42,
      boolTrue: true,
      boolFalse: false,
      zero: 0
    }
  );
  assert.equal(result, "Num: 42, BoolTrue: true, BoolFalse: false, Zero: 0");
});

test("interpolateTemplate - null, undefined, and missing variables", () => {
  const result = interpolateTemplate(
    "Null: [{{nullVal}}], Undef: [{{undefVal}}], Missing: [{{missing}}]",
    {
      nullVal: null,
      undefVal: undefined
      // missing is not defined
    }
  );
  assert.equal(result, "Null: [], Undef: [], Missing: []");
});

test("interpolateTemplate - whitespace tolerance", () => {
  const result = interpolateTemplate(
    "{{tight}} {{  loose  }} {{\nnewline\n}}",
    {
      tight: "a",
      loose: "b",
      newline: "c"
    }
  );
  assert.equal(result, "a b c");
});

test("interpolateTemplate - keys with dots and dashes", () => {
  const result = interpolateTemplate(
    "User: {{user.first-name}} {{user.last_name}}",
    {
      "user.first-name": "John",
      "user.last_name": "Doe" // Though the regex allows \w (letters, digits, underscores), dots, and dashes.
    }
  );
  assert.equal(result, "User: John Doe");
});

test("interpolateTemplate - without variables argument", () => {
  const result = interpolateTemplate("Hello {{name}}!");
  assert.equal(result, "Hello !");
});

test("interpolateTemplate - template without variables", () => {
  const result = interpolateTemplate("Hello World!", { name: "test" });
  assert.equal(result, "Hello World!");
});

test("interpolateTemplate - identical variables multiple times", () => {
  const result = interpolateTemplate("{{val}} + {{val}} = {{sum}}", { val: 2, sum: 4 });
  assert.equal(result, "2 + 2 = 4");
});


import {
  getNotificationHistory,
  createNotification,
  createAiResponseNotification,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
  subscribeNotifications
} from "@/lib/notifications";

// --- Mocking the Browser Environment ---
let mockStorage: Record<string, string> = {};
let mockEvents: { type: string; callback: EventListener }[] = [];
let eventDispatchCount = 0;

// Setup before each test using a helper function since node:test beforeEach is sometimes tricky
// with global modifications depending on execution order.
function setupWindow() {
  mockStorage = {};
  mockEvents = [];
  eventDispatchCount = 0;

  (global as any).window = {
    localStorage: {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      clear: () => { mockStorage = {}; }
    },
    dispatchEvent: (event: CustomEvent) => {
      eventDispatchCount++;
      mockEvents.forEach(e => {
        if (e.type === event.type) {
          e.callback(event);
        }
      });
      return true;
    },
    addEventListener: (type: string, callback: EventListener) => {
      mockEvents.push({ type, callback });
    },
    removeEventListener: (type: string, callback: EventListener) => {
      mockEvents = mockEvents.filter(e => !(e.type === type && e.callback === callback));
    }
  };

  // Also need to mock CustomEvent for dispatchEvent
  (global as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, options?: any) {
      this.type = type;
      this.detail = options?.detail;
    }
  };

  // Mock crypto.randomUUID
  if (!(global as any).crypto) {
    (global as any).crypto = {};
  }
  let idCounter = 0;
  (global as any).crypto.randomUUID = () => `mock-uuid-${idCounter++}`;
}

function teardownWindow() {
  delete (global as any).window;
  delete (global as any).CustomEvent;
}

test("getNotificationHistory - returns empty array when window is undefined", () => {
  teardownWindow();
  const history = getNotificationHistory();
  assert.deepEqual(history, []);
});

test("getNotificationHistory - returns empty array when storage is empty", () => {
  setupWindow();
  const history = getNotificationHistory();
  assert.deepEqual(history, []);
});

test("getNotificationHistory - returns empty array on invalid JSON", () => {
  setupWindow();
  mockStorage["mai.notifications.history.v1"] = "invalid json";
  const history = getNotificationHistory();
  assert.deepEqual(history, []);
});

test("getNotificationHistory - returns empty array if JSON is not an array", () => {
  setupWindow();
  mockStorage["mai.notifications.history.v1"] = JSON.stringify({ not: "an array" });
  const history = getNotificationHistory();
  assert.deepEqual(history, []);
});

test("getNotificationHistory - returns valid parsed notifications, filtering invalid items, max 150", () => {
  setupWindow();
  const validItem = { id: "1", title: "Test", level: "info" };
  const items = [
    null,
    validItem,
    "string",
    { id: "2", title: "Test 2", level: "warning" }
  ];

  // Add enough to test the slice
  for (let i = 0; i < 160; i++) {
    items.push({ id: `ext-${i}`, title: "Ext", level: "info" });
  }

  mockStorage["mai.notifications.history.v1"] = JSON.stringify(items);

  const history = getNotificationHistory();
  // Filter removes null and "string" (not objects)
  // length should be capped at 150
  assert.equal(history.length, 150);
  assert.equal(history[0].id, "1");
  assert.equal(history[1].id, "2");
});

test("createNotification - creates and saves notification, dispatches event", () => {
  setupWindow();

  createNotification({
    level: "success",
    message: "Operation successful {{value}}",
    title: "Success",
    variables: { value: 123 },
    metadata: { chatId: "chat-1" }
  });

  const history = getNotificationHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].level, "success");
  assert.equal(history[0].message, "Operation successful 123");
  assert.equal(history[0].title, "Success");
  assert.equal(history[0].read, false);
  assert.equal(history[0].source, "system");
  assert.equal(history[0].metadata?.chatId, "chat-1");
  assert.ok(history[0].id.startsWith("mock-uuid"));
  assert.ok(history[0].createdAt);

  assert.equal(eventDispatchCount, 1);
});

test("createNotification - uses default title by level if not provided", () => {
  setupWindow();

  createNotification({
    level: "warning",
    message: "Be careful"
  });

  const history = getNotificationHistory();
  assert.equal(history[0].title, "Avertissement");
});

test("createAiResponseNotification - started phase", () => {
  setupWindow();

  createAiResponseNotification({
    phase: "started",
    chatId: "chat-1",
    conversationTitle: "My Chat"
  });

  const history = getNotificationHistory();
  assert.equal(history[0].level, "info");
  assert.equal(history[0].title, "Réponse IA en cours");
  assert.equal(history[0].message, "La conversation « My Chat » est en cours de génération.");
  assert.equal(history[0].metadata?.chatId, "chat-1");
  assert.equal(history[0].metadata?.phase, "started");
});

test("createAiResponseNotification - completed phase", () => {
  setupWindow();

  createAiResponseNotification({
    phase: "completed",
    chatId: "chat-1",
    preview: "Here is your response"
  });

  const history = getNotificationHistory();
  assert.equal(history[0].level, "success");
  assert.equal(history[0].message, "Here is your response");
});

test("createAiResponseNotification - error phase", () => {
  setupWindow();

  createAiResponseNotification({
    phase: "error",
    chatId: "chat-1"
  });

  const history = getNotificationHistory();
  assert.equal(history[0].level, "error");
  // Testing fallback behavior for missing conversation title
  assert.equal(history[0].message, "Une erreur est survenue sur la conversation « Sans titre ».");
});

test("markNotificationRead - updates specific notification read status", () => {
  setupWindow();

  createNotification({ level: "info", message: "1" });
  createNotification({ level: "info", message: "2" });

  const historyBefore = getNotificationHistory();
  const idToMark = historyBefore[0].id;
  const otherId = historyBefore[1].id;

  assert.equal(historyBefore[0].read, false);
  assert.equal(historyBefore[1].read, false);

  const initialEventCount = eventDispatchCount;

  markNotificationRead(idToMark, true);

  const historyAfter = getNotificationHistory();
  assert.equal(historyAfter.find(n => n.id === idToMark)?.read, true);
  assert.equal(historyAfter.find(n => n.id === otherId)?.read, false);

  assert.equal(eventDispatchCount, initialEventCount + 1);
});

test("markAllNotificationsRead - updates all notifications", () => {
  setupWindow();

  createNotification({ level: "info", message: "1" });
  createNotification({ level: "info", message: "2" });

  markAllNotificationsRead(true);

  const historyAfter = getNotificationHistory();
  assert.equal(historyAfter[0].read, true);
  assert.equal(historyAfter[1].read, true);
});

test("clearNotifications - removes all notifications", () => {
  setupWindow();

  createNotification({ level: "info", message: "1" });

  assert.equal(getNotificationHistory().length, 1);

  clearNotifications();

  assert.equal(getNotificationHistory().length, 0);
});

test("subscribeNotifications - adds and removes event listener", () => {
  setupWindow();

  let callbackCount = 0;
  const callback = () => { callbackCount++; };

  const unsubscribe = subscribeNotifications(callback);

  // Trigger event
  createNotification({ level: "info", message: "1" });
  assert.equal(callbackCount, 1);

  // Unsubscribe
  unsubscribe();

  // Trigger event again
  createNotification({ level: "info", message: "2" });
  // Should still be 1
  assert.equal(callbackCount, 1);
});

test("subscribeNotifications - handles missing window gracefully", () => {
  teardownWindow();

  let callbackCount = 0;
  const callback = () => { callbackCount++; };

  const unsubscribe = subscribeNotifications(callback);

  // Shouldn't throw
  unsubscribe();
});
