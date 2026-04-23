import assert from "node:assert/strict";
import { test } from "node:test";
import { extractJsonObjectsFromStream } from "@/lib/json-stream-parser";

test("parse objets JSON concaténés", () => {
  const raw = '{"type":"a","id":"1"}{"type":"b","delta":"Hi"}';
  const events = extractJsonObjectsFromStream(raw);
  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { type: "a", id: "1" });
});

test("strings avec accolades", () => {
  const raw = '{"text":"obj {x} in str"}{"ok":true}';
  assert.equal(extractJsonObjectsFromStream(raw).length, 2);
});

test("ignore chunks malformés", () => {
  const raw = '{"v":true}{bad}{"v2":true}';
  assert.equal(extractJsonObjectsFromStream(raw).length, 2);
});

test("chaîne vide → []", () => {
  assert.deepEqual(extractJsonObjectsFromStream(""), []);
});

test("objets imbriqués", () => {
  const raw = '{"a":{"b":{"c":1}}}{"d":2}';
  assert.equal(extractJsonObjectsFromStream(raw).length, 2);
  assert.deepEqual(extractJsonObjectsFromStream(raw)[0], { a: { b: { c: 1 } } });
});
