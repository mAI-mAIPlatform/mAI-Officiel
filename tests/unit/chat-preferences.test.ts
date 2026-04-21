import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { readJsonStorage } from "@/lib/chat-preferences";

afterEach(() => {
  // Clean up global window object after each test if it exists
  if (global.window !== undefined) {
    // @ts-expect-error
    delete global.window;
  }
});

test("readJsonStorage - window is undefined", () => {
  // Ensure window is undefined
  assert.equal(typeof window, "undefined");
  const fallback = { test: "fallback" };
  const result = readJsonStorage("my_key", fallback);
  assert.equal(result, fallback);
});

test("readJsonStorage - window is defined but item is null", () => {
  const mockGetItem = (key: string) => null;

  Object.defineProperty(global, "window", {
    value: {
      localStorage: {
        getItem: mockGetItem,
      },
    },
    configurable: true,
  });

  const fallback = { test: "fallback" };
  const result = readJsonStorage("my_key", fallback);
  assert.equal(result, fallback);
});

test("readJsonStorage - window is defined and item is valid JSON", () => {
  const data = { value: "real_data" };
  const mockGetItem = (key: string) => JSON.stringify(data);

  Object.defineProperty(global, "window", {
    value: {
      localStorage: {
        getItem: mockGetItem,
      },
    },
    configurable: true,
  });

  const fallback = { value: "fallback" };
  const result = readJsonStorage("my_key", fallback);
  assert.deepEqual(result, data);
});

test("readJsonStorage - window is defined and item is invalid JSON", () => {
  const mockGetItem = (key: string) => "invalid_json_string";

  Object.defineProperty(global, "window", {
    value: {
      localStorage: {
        getItem: mockGetItem,
      },
    },
    configurable: true,
  });

  const fallback = { test: "fallback" };
  const result = readJsonStorage("my_key", fallback);
  assert.equal(result, fallback);
});

test("readJsonStorage - window is defined but localStorage.getItem throws", () => {
  const mockGetItem = (key: string) => {
    throw new Error("Access denied");
  };

  Object.defineProperty(global, "window", {
    value: {
      localStorage: {
        getItem: mockGetItem,
      },
    },
    configurable: true,
  });

  const fallback = { test: "fallback" };
  const result = readJsonStorage("my_key", fallback);
  assert.equal(result, fallback);
});
