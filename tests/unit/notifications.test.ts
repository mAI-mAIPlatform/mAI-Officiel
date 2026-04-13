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
