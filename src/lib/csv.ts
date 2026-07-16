// Pure CSV builders for accountant export. RFC 4180 quoting, a UTF-8 BOM so
// Excel opens it correctly, and formula-injection guarding on text fields.

type Cell = string | number | null;

function guardFormula(value: string): string {
  // A leading =, +, -, @ (or control char) can be read as a formula by Excel /
  // Sheets. Prefix a single quote so text stays text.
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCell(value: Cell): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const guarded = guardFormula(raw);
  if (/[",\r\n]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

/** header row + data rows → CSV text with a leading BOM. */
export function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** cents → "1234.56", null → "" (empty cell imports cleaner than 0). */
function money(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

/** Date → "yyyy-mm-dd" (UTC), null → "". ISO imports cleanly everywhere. */
function isoDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export type PayslipExport = {
  periodStart: Date | null;
  periodEnd: Date | null;
  grossPay: number | null;
  tax: number | null;
  netPay: number | null;
  fuelAllowance: number | null;
  mealAllowance: number | null;
  superannuation: number | null;
};

export function payslipsCsv(payslips: PayslipExport[]): string {
  return toCsv(
    [
      "Period start",
      "Period end",
      "Gross pay",
      "Tax withheld (PAYG)",
      "Net pay",
      "Fuel allowance",
      "Meal allowance",
      "Superannuation",
    ],
    payslips.map((p) => [
      isoDate(p.periodStart),
      isoDate(p.periodEnd),
      money(p.grossPay),
      money(p.tax),
      money(p.netPay),
      money(p.fuelAllowance),
      money(p.mealAllowance),
      money(p.superannuation),
    ])
  );
}

export type DeductionExport = {
  date: Date | null;
  description: string;
  category: string;
  amount: number;
};

export function deductionsCsv(deductions: DeductionExport[]): string {
  return toCsv(
    ["Date", "Description", "Category", "Amount"],
    deductions.map((d) => [
      isoDate(d.date),
      d.description,
      d.category,
      money(d.amount),
    ])
  );
}
