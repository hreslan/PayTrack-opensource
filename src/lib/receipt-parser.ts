// Pure receipt text parser: pulls the date, the total amount and what the
// purchase was from receipt/invoice text. The file itself is never kept.

import { NUMERIC_LINE_RE, findDates, firstAmount } from "./parser.ts";

export type ReceiptFields = {
  /** ISO yyyy-mm-dd or null */
  date: string | null;
  /** integer cents or null */
  total: number | null;
  /** merchant / item description or null */
  item: string | null;
};

const TOTAL_RE = /total\b/i;
const SUBTOTAL_RE = /sub[\s-]?total/i;
const FALLBACK_TOTAL_RE =
  /amount\s*(?:due|paid|payable)|balance\s*due|eftpos|visa|mastercard|\bcash\b|\bcard\b/i;
// Lines that are receipt boilerplate, not what was bought.
const BOILERPLATE_RE =
  /tax\s*invoice|receipt|\babn\b|\bacn\b|\bgst\b|invoice|welcome|thank|store|ph[:\s]|tel[:\s]|www\.|@/i;

function amountOn(lines: string[], i: number): number | null {
  const inline = firstAmount(lines[i]);
  if (inline !== null) return inline;
  const next = lines[i + 1];
  if (next && NUMERIC_LINE_RE.test(next)) return firstAmount(next);
  return null;
}

export function parseReceipt(text: string): ReceiptFields {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Item: the first line that reads like a name, skipping boilerplate.
  const item =
    lines.find((l) => /[a-z]{3,}/i.test(l) && !BOILERPLATE_RE.test(l)) ?? null;

  // Total: the largest amount on a "Total" line (totals always exceed their
  // components, which sidesteps "GST included in total" style lines).
  const totalCandidates: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (TOTAL_RE.test(lines[i]) && !SUBTOTAL_RE.test(lines[i])) {
      const cents = amountOn(lines, i);
      if (cents !== null) totalCandidates.push(cents);
    }
  }
  let total = totalCandidates.length > 0 ? Math.max(...totalCandidates) : null;

  if (total === null) {
    for (let i = 0; i < lines.length; i++) {
      if (FALLBACK_TOTAL_RE.test(lines[i])) {
        const cents = amountOn(lines, i);
        if (cents !== null) {
          total = cents;
          break;
        }
      }
    }
  }

  if (total === null) {
    // Last resort: the largest money amount anywhere on the receipt.
    let max: number | null = null;
    for (const line of lines) {
      const cents = firstAmount(line);
      if (cents !== null && (max === null || cents > max)) max = cents;
    }
    total = max;
  }

  const dates = findDates(text);

  return { date: dates[0] ?? null, total, item };
}
