import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePayslip } from "../src/lib/parser.ts";
import {
  FIXTURE_TABULAR,
  FIXTURE_MYOB,
  FIXTURE_XERO,
  FIXTURE_COLUMNAR,
} from "./fixtures.ts";

test("layout 1: classic tabular payslip with $ amounts and date-range period", () => {
  const r = parsePayslip(FIXTURE_TABULAR);
  assert.equal(r.periodStart, "2026-06-01");
  assert.equal(r.periodEnd, "2026-06-14");
  assert.equal(r.grossPay, 288462);
  assert.equal(r.tax, 61200);
  assert.equal(r.fuelAllowance, 15000);
  assert.equal(r.mealAllowance, 4550);
  assert.equal(r.superannuation, 33173);
  assert.equal(r.netPay, 246812);
  assert.equal(r.labels.tax, "PAYG Withholding");
  assert.equal(r.labels.period, "Pay Period");
});

test("layout 2: MYOB-style, Period Ending only, EFT net, no allowances", () => {
  const r = parsePayslip(FIXTURE_MYOB);
  assert.equal(r.periodStart, null, "start must stay null when only an end date exists");
  assert.equal(r.periodEnd, "2026-06-30");
  assert.equal(r.grossPay, 320000);
  assert.equal(r.tax, 75000, "TFN line must not be mistaken for tax");
  assert.equal(r.superannuation, 36800);
  assert.equal(r.netPay, 245000);
  assert.equal(r.fuelAllowance, null, "missing fields must be null, never guessed");
  assert.equal(r.mealAllowance, null);
  assert.equal(r.labels.netPay, "EFT Amount");
});

test("layout 3: uppercase Xero-style with written month names", () => {
  const r = parsePayslip(FIXTURE_XERO);
  assert.equal(r.periodStart, "2026-06-15");
  assert.equal(r.periodEnd, "2026-06-28");
  assert.equal(r.grossPay, 410577);
  assert.equal(r.tax, 102200);
  assert.equal(r.fuelAllowance, 12000, "travel allowance maps to fuel allowance");
  assert.equal(r.superannuation, 47216);
  assert.equal(r.netPay, 320377);
  assert.equal(r.mealAllowance, null);
});

test("layout 4: column-split layout with amounts on the line after the label", () => {
  const r = parsePayslip(FIXTURE_COLUMNAR);
  assert.equal(r.periodStart, "2026-06-22");
  assert.equal(r.periodEnd, "2026-07-05", "payment date must not be mistaken for period end");
  assert.equal(r.grossPay, 128249, "Total Earnings maps to gross pay");
  assert.equal(r.netPay, 117849);
  assert.equal(r.tax, 10400, "PAYG amount comes from the next numbers-only line");
  assert.equal(r.mealAllowance, 3800, "the $19.0000 unit rate must be skipped");
  assert.equal(r.fuelAllowance, 8776, "travel allowance maps to fuel, skipping the rate");
  assert.equal(r.superannuation, 11204);
});

test("empty text returns all nulls", () => {
  const r = parsePayslip("");
  assert.equal(r.periodStart, null);
  assert.equal(r.periodEnd, null);
  assert.equal(r.netPay, null);
  assert.equal(r.grossPay, null);
  assert.equal(r.tax, null);
  assert.equal(r.fuelAllowance, null);
  assert.equal(r.mealAllowance, null);
  assert.equal(r.superannuation, null);
});
