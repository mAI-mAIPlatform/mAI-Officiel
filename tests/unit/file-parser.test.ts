import assert from "node:assert/strict";
import { test } from "node:test";
import { validateFileBeforeUpload, MAX_UPLOAD_SIZE_BYTES } from "../../lib/file-parser";

test("validateFileBeforeUpload", async (t) => {
  await t.test("returns null for a valid file", () => {
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    assert.equal(validateFileBeforeUpload(file), null);
  });

  await t.test("returns error if file size exceeds MAX_UPLOAD_SIZE_BYTES", () => {
    // Create a mock File object to simulate a large file without actually allocating memory
    const file = {
      name: "large.pdf",
      type: "application/pdf",
      size: MAX_UPLOAD_SIZE_BYTES + 1,
    } as File;
    const result = validateFileBeforeUpload(file);
    assert.match(result as string, /dépasse la limite de 5MB/);
  });

  await t.test("returns error if file type is not supported", () => {
    const file = new File(["test content"], "test.exe", { type: "application/x-msdownload" });
    const result = validateFileBeforeUpload(file);
    assert.match(result as string, /Format non supporté/);
  });

  await t.test("returns error with 'inconnu' if file type is empty", () => {
    const file = new File(["test content"], "test", { type: "" });
    const result = validateFileBeforeUpload(file);
    assert.match(result as string, /inconnu/);
  });
});
