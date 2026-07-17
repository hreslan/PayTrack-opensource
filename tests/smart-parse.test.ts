import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeLlmPayslip,
  mergePayslip,
  normalizeLlmReceipt,
  smartParsePayslip,
  smartParseReceipt,
} from "../src/lib/smart-parse.ts";
import { parsePayslip } from "../src/lib/parser.ts";
import { FIXTURE_TABULAR } from "./fixtures.ts";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.GEMINI_API_KEY;
});

/** Make the LLM "return" a given JSON object via a mocked fetch. */
function mockLlm(obj: unknown) {
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify(obj) } }] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )) as typeof fetch;
}

test("normalizeLlmPayslip converts dollars to cents and validates dates", () => {
  const r = normalizeLlmPayslip({
    periodStart: "2026-06-22",
    periodEnd: "not-a-date",
    grossPay: 1282.49,
    netPay: "1,178.49",
    tax: null,
    superannuation: 112.04,
    labels: { grossPay: "Total Earnings", bogus: 5 },
  });
  assert.equal(r.periodStart, "2026-06-22");
  assert.equal(r.periodEnd, null);
  assert.equal(r.grossPay, 128249);
  assert.equal(r.netPay, 117849);
  assert.equal(r.tax, null);
  assert.equal(r.superannuation, 11204);
  assert.equal(r.labels?.grossPay, "Total Earnings");
});

test("mergePayslip prefers the LLM value, falls back to regex per field", () => {
  const base = parsePayslip(FIXTURE_TABULAR); // full regex result
  const merged = mergePayslip(base, {
    grossPay: 999900, // LLM overrides
    netPay: null, // falls back to regex
    labels: { grossPay: "Gross Earnings" },
  });
  assert.equal(merged.grossPay, 999900);
  assert.equal(merged.netPay, base.netPay);
  assert.equal(merged.tax, base.tax);
  assert.equal(merged.labels.grossPay, "Gross Earnings");
});

test("normalizeLlmReceipt only accepts a category from the allowed list", () => {
  const ok = normalizeLlmReceipt({
    date: "2026-07-08",
    total: 78.24,
    item: "Ampol Peakhurst",
    category: "Fuel & vehicle",
  });
  assert.deepEqual(ok, { date: "2026-07-08", total: 7824, item: "Ampol Peakhurst", category: "Fuel & vehicle" });

  const bad = normalizeLlmReceipt({ total: 10, category: "Snacks" });
  assert.equal(bad.category, null);
});

test("smartParsePayslip falls back to the pattern parser when no key is set", async () => {
  const r = await smartParsePayslip(FIXTURE_TABULAR);
  assert.deepEqual(r, parsePayslip(FIXTURE_TABULAR));
});

test("smartParsePayslip uses LLM output when configured", async () => {
  mockLlm({
    periodStart: "2026-01-01",
    periodEnd: "2026-01-14",
    grossPay: 5000,
    netPay: 4000,
    tax: 900,
    superannuation: 575,
    fuelAllowance: null,
    mealAllowance: null,
    labels: { grossPay: "Gross" },
  });
  const r = await smartParsePayslip("anything at all");
  assert.equal(r.grossPay, 500000);
  assert.equal(r.netPay, 400000);
  assert.equal(r.periodEnd, "2026-01-14");
});

test("smartParseReceipt returns a suggested category from the LLM", async () => {
  mockLlm({ date: "2026-07-03", total: 174.95, item: "TradeGear Workwear", category: "Work uniform" });
  const r = await smartParseReceipt("receipt text");
  assert.equal(r.total, 17495);
  assert.equal(r.item, "TradeGear Workwear");
  assert.equal(r.category, "Work uniform");
});

test("smartParseReceipt survives an LLM failure by using regex", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = (async () => new Response("boom", { status: 500 })) as typeof fetch;
  const r = await smartParseReceipt("Cafe\nTOTAL $12.50");
  assert.equal(r.total, 1250);
  assert.equal(r.category, null);
});
