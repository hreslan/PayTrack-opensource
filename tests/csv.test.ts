import { test } from "node:test";
import assert from "node:assert/strict";
import { toCsv, payslipsCsv, deductionsCsv, otherIncomeCsv } from "../src/lib/csv.ts";

const BOM = "﻿";

test("toCsv writes a BOM, CRLF rows and a trailing newline", () => {
  const out = toCsv(["a", "b"], [["1", "2"]]);
  assert.equal(out, `${BOM}a,b\r\n1,2\r\n`);
});

test("toCsv quotes fields with commas, quotes and newlines", () => {
  const out = toCsv(["x"], [['he said "hi", loudly'], ["line1\nline2"]]);
  assert.ok(out.includes('"he said ""hi"", loudly"'));
  assert.ok(out.includes('"line1\nline2"'));
});

test("toCsv guards against formula injection in text", () => {
  const out = toCsv(["desc"], [["=1+2"], ["+cmd"], ["@SUM(A1)"], ["-danger"]]);
  assert.ok(out.includes("'=1+2"));
  assert.ok(out.includes("'+cmd"));
  assert.ok(out.includes("'@SUM(A1)"));
  assert.ok(out.includes("'-danger"));
});

test("payslipsCsv formats cents as dollars, nulls as empty, dates as ISO", () => {
  const out = payslipsCsv([
    {
      periodStart: new Date("2026-06-22T00:00:00Z"),
      periodEnd: new Date("2026-07-05T00:00:00Z"),
      grossPay: 128249,
      tax: 10400,
      netPay: 117849,
      fuelAllowance: 8776,
      mealAllowance: null,
      superannuation: 11204,
    },
  ]);
  const dataRow = out.trim().split("\r\n")[1];
  assert.equal(
    dataRow,
    "2026-06-22,2026-07-05,1282.49,104.00,1178.49,87.76,,112.04"
  );
});

test("deductionsCsv escapes a description containing a comma", () => {
  const out = deductionsCsv([
    { date: new Date("2026-07-08T00:00:00Z"), description: "Boots, steel cap", category: "Work uniform", amount: 12995 },
  ]);
  const dataRow = out.trim().split("\r\n")[1];
  assert.equal(dataRow, '2026-07-08,"Boots, steel cap",Work uniform,129.95');
});

test("otherIncomeCsv writes a Source/Tax withheld header, leaves missing date and tax blank", () => {
  const out = otherIncomeCsv([
    {
      date: new Date("2026-07-01T00:00:00Z"),
      description: "Savings account interest",
      category: "Bank interest",
      amount: 4312,
      tax: null,
    },
    {
      date: null,
      description: "Weekend job",
      category: "Freelance / ABN work",
      amount: 250000,
      tax: 47500,
    },
  ]);
  assert.ok(out.startsWith(`${BOM}Date,Source,Category,Amount,Tax withheld`));
  const [, first, second] = out.trim().split("\r\n");
  assert.equal(first, "2026-07-01,Savings account interest,Bank interest,43.12,");
  assert.equal(second, ",Weekend job,Freelance / ABN work,2500.00,475.00");
});
