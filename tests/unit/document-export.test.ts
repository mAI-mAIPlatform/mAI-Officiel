import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExportFileName } from "../../lib/document-export.ts";

test("buildExportFileName", async (t) => {
  await t.test("formats normal title correctly", () => {
    assert.equal(buildExportFileName("My Document", "pdf"), "my-document.pdf");
    assert.equal(buildExportFileName("Business Plan 2024", "doc"), "business-plan-2024.doc");
  });

  await t.test("replaces special characters with hyphens and collapses them", () => {
    assert.equal(
      buildExportFileName("Hello! World@2024", "doc"),
      "hello-world-2024.doc"
    );
    assert.equal(
      buildExportFileName("Data: The (new) oil?!", "pptx"),
      "data-the-new-oil.pptx"
    );
  });

  await t.test("strips leading and trailing hyphens", () => {
    assert.equal(
      buildExportFileName("---Test Title---", "pptx"),
      "test-title.pptx"
    );
    assert.equal(
      buildExportFileName("!@#Hello World$%^", "pdf"),
      "hello-world.pdf"
    );
  });

  await t.test("falls back to 'document' for empty or special-only titles", () => {
    assert.equal(buildExportFileName("", "xlsx"), "document.xlsx");
    assert.equal(buildExportFileName("!!!@@@", "pdf"), "document.pdf");
    assert.equal(buildExportFileName("---", "doc"), "document.doc");
  });

  await t.test("truncates to 60 characters", () => {
    const longTitle = "a".repeat(70);
    assert.equal(
      buildExportFileName(longTitle, "doc"),
      `${"a".repeat(60)}.doc`
    );
  });

  await t.test("truncation does not leave trailing hyphens from middle of original string", () => {
    const longTitleWithHyphenAtEnd = "a".repeat(59) + " b";
    assert.equal(
      buildExportFileName(longTitleWithHyphenAtEnd, "pdf"),
      `${"a".repeat(59)}-.pdf`
    );
  });
});
