import assert from "node:assert/strict";
import { computeNextDueDate } from "@/lib/tasks";

const baseDate = new Date("2026-01-10T10:00:00.000Z");

const daily = computeNextDueDate(baseDate, "daily", 2);
assert.equal(daily?.toISOString(), "2026-01-12T10:00:00.000Z");

const weekly = computeNextDueDate(baseDate, "weekly", 1);
assert.equal(weekly?.toISOString(), "2026-01-17T10:00:00.000Z");

const monthly = computeNextDueDate(baseDate, "monthly", 1);
assert.equal(monthly?.toISOString(), "2026-02-10T10:00:00.000Z");

const customFallback = computeNextDueDate(baseDate, "custom", null);
assert.equal(customFallback?.toISOString(), "2026-01-11T10:00:00.000Z");

const none = computeNextDueDate(baseDate, "none", 10);
assert.equal(none, null);

console.log("tasks-repeat.test.ts: OK");
