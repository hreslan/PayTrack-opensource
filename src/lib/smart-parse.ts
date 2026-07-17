// LLM-assisted parsing that works on any document layout, with the built-in
// pattern parser as both a per-field fallback and the total fallback when
// DeepSeek is not configured or the call fails.

import { parsePayslip, type AmountField, type ExtractedFields } from "./parser.ts";
import { parseReceipt, type ReceiptFields } from "./receipt-parser.ts";
import { DEDUCTION_CATEGORIES } from "./deduction-categories.ts";
import { callLlmJson, llmConfigured } from "./llm.ts";

// ---- shared value normalizers (pure, unit-tested) ----

function toCents(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) : null;
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,\s]/g, "");
    if (/^-?\d+(\.\d+)?$/.test(cleaned)) return Math.round(Number(cleaned) * 100);
  }
  return null;
}

function toIsoDate(v: unknown): string | null {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(`${v}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return v;
  }
  return null;
}

function asObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

const AMOUNT_FIELDS: AmountField[] = [
  "netPay",
  "grossPay",
  "tax",
  "fuelAllowance",
  "mealAllowance",
  "superannuation",
];

// ---- payslips ----

export const PAYSLIP_SYSTEM =
  "You extract structured data from Australian payslips. Payslip layouts vary widely. " +
  "Respond ONLY with a JSON object. Never invent values that are not present.";

export function payslipPrompt(text: string): string {
  return `From the payslip text below, extract these fields. Use null for anything not clearly present — do not guess.

- periodStart, periodEnd: the pay period start and end as "YYYY-MM-DD". Source dates are Australian (day first). If only one date is given, treat it as periodEnd.
- grossPay: total gross earnings
- netPay: net / take-home / amount paid
- tax: PAYG / tax withheld / income tax
- superannuation: employer super (SG)
- fuelAllowance: fuel / car / motor vehicle / travel allowance
- mealAllowance: meal allowance / meal money

Amounts must be plain numbers in dollars (e.g. 1282.49), no "$" or commas. Ignore hourly/unit rates; use the actual earned/withheld amounts.
Also include "labels": an object mapping any found field name to the exact label text used on the payslip.

Return JSON exactly like:
{"periodStart":null,"periodEnd":null,"grossPay":null,"netPay":null,"tax":null,"superannuation":null,"fuelAllowance":null,"mealAllowance":null,"labels":{}}

Payslip text:
"""
${text}
"""`;
}

export function normalizeLlmPayslip(raw: unknown): Partial<ExtractedFields> {
  const o = asObject(raw);
  const labelsRaw = asObject(o.labels);
  const labels: ExtractedFields["labels"] = {};
  for (const [k, v] of Object.entries(labelsRaw)) {
    if (typeof v === "string" && v.trim()) {
      labels[k as AmountField | "period"] = v.trim();
    }
  }
  const out: Partial<ExtractedFields> = {
    periodStart: toIsoDate(o.periodStart),
    periodEnd: toIsoDate(o.periodEnd),
    labels,
  };
  for (const f of AMOUNT_FIELDS) out[f] = toCents(o[f]);
  return out;
}

/** Merge: prefer the LLM value when present, fall back to regex per field. */
export function mergePayslip(
  base: ExtractedFields,
  llm: Partial<ExtractedFields>
): ExtractedFields {
  const merged: ExtractedFields = { ...base, labels: { ...base.labels } };
  merged.periodStart = llm.periodStart ?? base.periodStart;
  merged.periodEnd = llm.periodEnd ?? base.periodEnd;
  for (const f of AMOUNT_FIELDS) {
    merged[f] = (llm[f] ?? base[f]) as number | null;
  }
  for (const [k, v] of Object.entries(llm.labels ?? {})) {
    if (v) merged.labels[k as AmountField | "period"] = v;
  }
  return merged;
}

export async function smartParsePayslip(text: string): Promise<ExtractedFields> {
  const base = parsePayslip(text);
  if (!llmConfigured()) return base;
  try {
    const raw = await callLlmJson(PAYSLIP_SYSTEM, payslipPrompt(text));
    return mergePayslip(base, normalizeLlmPayslip(raw));
  } catch (err) {
    console.error(
      "LLM payslip parse failed, using pattern parser:",
      err instanceof Error ? err.message : err
    );
    return base;
  }
}

// ---- receipts ----

export type SmartReceiptFields = ReceiptFields & { category: string | null };

export const RECEIPT_SYSTEM =
  "You extract structured data from receipts and tax invoices for work-related expense claims. " +
  "Respond ONLY with a JSON object. Never invent values that are not present.";

export function receiptPrompt(text: string): string {
  return `From the receipt/invoice text below, extract:

- date: purchase date as "YYYY-MM-DD" (source is Australian, day first), or null
- total: the final total paid, as a plain number in dollars (e.g. 78.24), or null. Prefer the grand total over subtotals or GST lines.
- item: a short description of the merchant or what was bought, or null
- category: the single best-fitting expense category from this exact list, or null if none fit: ${DEDUCTION_CATEGORIES.map((c) => `"${c}"`).join(", ")}

Return JSON exactly like:
{"date":null,"total":null,"item":null,"category":null}

Receipt text:
"""
${text}
"""`;
}

export function normalizeLlmReceipt(raw: unknown): SmartReceiptFields {
  const o = asObject(raw);
  const category =
    typeof o.category === "string" &&
    (DEDUCTION_CATEGORIES as readonly string[]).includes(o.category)
      ? o.category
      : null;
  const item =
    typeof o.item === "string" && o.item.trim() ? o.item.trim().slice(0, 120) : null;
  return {
    date: toIsoDate(o.date),
    total: toCents(o.total),
    item,
    category,
  };
}

export async function smartParseReceipt(text: string): Promise<SmartReceiptFields> {
  const base = parseReceipt(text);
  if (!llmConfigured()) return { ...base, category: null };
  try {
    const raw = await callLlmJson(RECEIPT_SYSTEM, receiptPrompt(text));
    const llm = normalizeLlmReceipt(raw);
    return {
      date: llm.date ?? base.date,
      total: llm.total ?? base.total,
      item: llm.item ?? base.item,
      category: llm.category,
    };
  } catch (err) {
    console.error(
      "LLM receipt parse failed, using pattern parser:",
      err instanceof Error ? err.message : err
    );
    return { ...base, category: null };
  }
}
