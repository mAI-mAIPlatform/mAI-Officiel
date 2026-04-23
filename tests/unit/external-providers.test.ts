import assert from "node:assert/strict";
import { test } from "node:test";
import { extractTextFromResponsesPayload } from "@/lib/ai/external-providers";

test("extractTextFromResponsesPayload - lit les deltas d'événements JSON", () => {
  const streamEvents = [
    JSON.stringify({ type: "response.output_text.delta", delta: "Salut" }),
    JSON.stringify({ type: "response.output_text.delta", delta: " !" }),
    JSON.stringify({ type: "response.completed" }),
  ];

  assert.equal(extractTextFromResponsesPayload(streamEvents), "Salut !");
});

test("extractTextFromResponsesPayload - fallback output_text", () => {
  assert.equal(
    extractTextFromResponsesPayload({ output_text: "  Bonjour  " }),
    "Bonjour"
  );
});

test("extractTextFromResponsesPayload - fallback output structuré", () => {
  assert.equal(
    extractTextFromResponsesPayload({
      output: [
        {
          content: [
            { type: "output_text", text: "Hello" },
            { type: "output_text", text: " world" },
          ],
        },
      ],
    }),
    "Hello world"
  );
});

test("extractTextFromResponsesPayload - parse une chaîne d'événements concaténés", () => {
  const rawStream =
    '{"type":"response.created","response":{"id":"resp_1"}}' +
    '{"type":"response.output_text.delta","delta":"Salut"}' +
    '{"type":"response.output_text.delta","delta":" !"}' +
    '{"type":"response.completed"}';

  assert.equal(extractTextFromResponsesPayload(rawStream), "Salut !");
});

test("extractTextFromResponsesPayload - gère un objet événement avec clé response", () => {
  const wrappedEvent = {
    type: "response.completed",
    response: {
      output_text: "Bonjour depuis response.completed",
    },
  };

  assert.equal(
    extractTextFromResponsesPayload(wrappedEvent),
    "Bonjour depuis response.completed"
  );
});

test("extractTextFromResponsesPayload - fallback output_text.done si pas de deltas", () => {
  const streamEvents = [
    { type: "response.created" },
    { type: "response.output_text.done", text: "Salut final" },
    { type: "response.completed" },
  ];

  assert.equal(extractTextFromResponsesPayload(streamEvents), "Salut final");
});

test("extractTextFromResponsesPayload - préfère output_text.done à la concat des deltas", () => {
  const streamEvents = [
    { type: "response.output_text.delta", delta: "Salut" },
    { type: "response.output_text.delta", delta: " !" },
    {
      type: "response.output_text.done",
      text: "Salut ! Comment puis-je t’aider ?",
    },
  ];

  assert.equal(
    extractTextFromResponsesPayload(streamEvents),
    "Salut ! Comment puis-je t’aider ?"
  );
});
