import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReceipt } from "../src/lib/receipt-parser.ts";
import { estimateTax, fyOf, fyLabel } from "../src/lib/tax.ts";

test("fuel receipt: subtotal/GST/total stack", () => {
  const r = parseReceipt(`
Ampol Peakhurst
TAX INVOICE - ABN 40 004 118 802
08/07/2026 17:42
Unleaded 91   41.2L @ $1.899
Subtotal $78.24
GST included $7.11
TOTAL $78.24
EFTPOS $78.24
`);
  assert.equal(r.item, "Ampol Peakhurst");
  assert.equal(r.date, "2026-07-08");
  assert.equal(r.total, 7824);
});

test("workwear receipt: amount on the line after Total", () => {
  const r = parseReceipt(`
TradeGear Workwear
Receipt #10233
Date: 3 Jul 2026
Hi-Vis Shirt L        $45.00
Steel Cap Boots       $129.95
Total
$174.95
VISA CREDIT
$174.95
`);
  assert.equal(r.item, "TradeGear Workwear");
  assert.equal(r.date, "2026-07-03");
  assert.equal(r.total, 17495);
});

test("invoice with Amount due and no Total line", () => {
  const r = parseReceipt(`
Sydney Tools Pty Ltd
Invoice 88812
12/06/2026
Cordless Drill Kit 240.00
Amount due 240.00
`);
  assert.equal(r.item, "Sydney Tools Pty Ltd");
  assert.equal(r.date, "2026-06-12");
  assert.equal(r.total, 24000);
});

test("empty receipt text returns all nulls", () => {
  const r = parseReceipt("");
  assert.deepEqual(r, { date: null, total: null, item: null });
});

test("tax estimate: 2026-27 bracket boundaries and offsets", () => {
  assert.equal(estimateTax(18_200_00).netTax, 0);
  // $30,000: tax 15% over 18,200 = 1,770; LITO 700; medicare min(600, 277.80) = 277.80
  assert.equal(estimateTax(30_000_00).incomeTax, 1_770_00);
  assert.equal(estimateTax(30_000_00).lito, 700_00);
  assert.equal(estimateTax(30_000_00).medicare, 277_80);
  assert.equal(estimateTax(30_000_00).netTax, 1_347_80);
  // $45,000 bracket edge: 15% of 26,800 = 4,020
  assert.equal(estimateTax(45_000_00).incomeTax, 4_020_00);
  // $100,000: 4,020 + 30% of 55,000 = 20,520; no LITO; medicare 2,000
  assert.equal(estimateTax(100_000_00).netTax, 20_520_00 + 2_000_00);
  // $150,000: 31,020 + 37% of 15,000 = 36,570; medicare 3,000
  assert.equal(estimateTax(150_000_00).netTax, 36_570_00 + 3_000_00);
  // $200,000: 51,370 + 45% of 10,000 = 55,870; medicare 4,000
  assert.equal(estimateTax(200_000_00).netTax, 55_870_00 + 4_000_00);
  // below the tax-free threshold nothing is payable
  assert.equal(estimateTax(10_000_00).netTax, 0);
});

test("financial year helpers", () => {
  assert.equal(fyOf(new Date("2026-06-30")), 2025);
  assert.equal(fyOf(new Date("2026-07-01")), 2026);
  assert.equal(fyLabel(2025), "2025–26");
});
