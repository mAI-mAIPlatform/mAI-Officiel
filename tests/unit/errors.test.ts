import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { type ErrorCode, getMessageByErrorCode } from "@/lib/errors";

describe("getMessageByErrorCode", () => {
  test("handles database errors", () => {
    assert.equal(
      getMessageByErrorCode("bad_request:database"),
      "An error occurred while executing a database query."
    );
    assert.equal(
      getMessageByErrorCode("not_found:database"),
      "An error occurred while executing a database query."
    );
  });

  test("handles api errors", () => {
    assert.equal(
      getMessageByErrorCode("bad_request:api"),
      "The request couldn't be processed. Please check your input and try again."
    );
  });

  test("handles activate_gateway errors", () => {
    assert.equal(
      getMessageByErrorCode("bad_request:activate_gateway"),
      "AI Gateway requires a valid credit card on file to service requests. Please visit https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card to add a card and unlock your free credits."
    );
  });

  test("handles auth errors", () => {
    assert.equal(
      getMessageByErrorCode("unauthorized:auth"),
      "You need to sign in before continuing."
    );
    assert.equal(
      getMessageByErrorCode("forbidden:auth"),
      "Your account does not have access to this feature."
    );
  });

  test("handles chat errors", () => {
    assert.equal(
      getMessageByErrorCode("rate_limit:chat"),
      "You've reached the message limit. Come back in 1 hour to continue chatting."
    );
    assert.equal(
      getMessageByErrorCode("not_found:chat"),
      "The requested chat was not found. Please check the chat ID and try again."
    );
    assert.equal(
      getMessageByErrorCode("forbidden:chat"),
      "This chat belongs to another user. Please check the chat ID and try again."
    );
    assert.equal(
      getMessageByErrorCode("unauthorized:chat"),
      "You need to sign in to view this chat. Please sign in and try again."
    );
    assert.equal(
      getMessageByErrorCode("offline:chat"),
      "We're having trouble sending your message. Please check your internet connection and try again."
    );
  });

  test("handles document errors", () => {
    assert.equal(
      getMessageByErrorCode("not_found:document"),
      "The requested document was not found. Please check the document ID and try again."
    );
    assert.equal(
      getMessageByErrorCode("forbidden:document"),
      "This document belongs to another user. Please check the document ID and try again."
    );
    assert.equal(
      getMessageByErrorCode("unauthorized:document"),
      "You need to sign in to view this document. Please sign in and try again."
    );
    assert.equal(
      getMessageByErrorCode("bad_request:document"),
      "The request to create or update the document was invalid. Please check your input and try again."
    );
  });

  test("handles fallback/default cases", () => {
    // We cast to ErrorCode to test fallback behavior since these might not be valid enum values but could occur dynamically
    assert.equal(
      getMessageByErrorCode("unknown:api" as ErrorCode),
      "Something went wrong. Please try again later."
    );
    assert.equal(
      getMessageByErrorCode("rate_limit:document" as ErrorCode),
      "Something went wrong. Please try again later."
    );
  });
});
