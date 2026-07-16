import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rateLimit,
  isLockedOut,
  recordFailure,
  clearFailures,
  LOGIN_FAILURE_LIMIT,
} from "../src/lib/rate-limit.ts";

test("rateLimit allows up to max attempts in the window, then blocks", () => {
  for (let i = 0; i < 5; i++) {
    assert.equal(rateLimit("reg:test", 5, 60_000), true, `attempt ${i + 1}`);
  }
  assert.equal(rateLimit("reg:test", 5, 60_000), false, "6th attempt blocked");
  assert.equal(rateLimit("reg:other", 5, 60_000), true, "other keys unaffected");
});

test("login lockout engages after repeated failures and clears on success", () => {
  const key = "login:someone@test.local";
  assert.equal(isLockedOut(key), false);
  for (let i = 0; i < LOGIN_FAILURE_LIMIT; i++) {
    assert.equal(isLockedOut(key), false, `not locked before failure ${i + 1}`);
    recordFailure(key);
  }
  assert.equal(isLockedOut(key), true, "locked after limit reached");
  clearFailures(key);
  assert.equal(isLockedOut(key), false, "cleared after successful login");
});
