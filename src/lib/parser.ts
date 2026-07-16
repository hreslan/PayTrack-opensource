// Pure payslip text parser. No IO, no dependencies — unit tested in tests/parser.test.ts.

export type AmountField =
  | "netPay"
  | "grossPay"
  | "tax"
  | "fuelAllowance"
  | "mealAllowance"
  | "superannuation";

export type ExtractedFields = {
  /** ISO dates (yyyy-mm-dd) or null when not found */
  periodStart: string | null;
  periodEnd: string | null;
  /** integer cents or null when not found */
  netPay: number | null;
  grossPay: number | null;
  tax: number | null;
  fuelAllowance: number | null;
  mealAllowance: number | null;
  superannuation: number | null;
  /** the original label text matched on the payslip, per field */
  labels: Partial<Record<AmountField | "period", string>>;
};

// An amount must look like money: either $-prefixed, or digits with a
// 2-decimal part. This avoids matching TFNs, ABNs and employee numbers.
const AMOUNT_RE = /\$\s*-?\d[\d,]*(?:\.\d+)?|-?\d[\d,]*\.\d{2}(?!\d)/;

// A line that is only numbers/currency — the "values" line in column layouts
// where the label and its amounts end up on separate lines.
export const NUMERIC_LINE_RE = /^[\s$\d.,()%*+-]+$/;

function toCents(raw: string): number | null {
  const n = Number(raw.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** First money amount in the text, skipping unit rates like $36.2600
 * (3+ decimal places), so "2.0000$19.0000$38.00$38.00" yields $38.00. */
export function firstAmount(text: string): number | null {
  for (const m of text.matchAll(new RegExp(AMOUNT_RE, "g"))) {
    const decimals = m[0].split(".")[1];
    if (decimals && decimals.replace(/\D/g, "").length > 2) continue;
    const cents = toCents(m[0]);
    if (cents !== null) return cents;
  }
  return null;
}

const AMOUNT_FIELDS: { key: AmountField; variants: RegExp[] }[] = [
  {
    key: "netPay",
    variants: [
      /net\s*pay\b/i,
      /net\s*income\b/i,
      /take[\s-]*home\s*pay\b/i,
      /amount\s*paid\b/i,
      /eft\s*amount\b/i,
    ],
  },
  {
    key: "grossPay",
    variants: [
      /gross\s*pay\b/i,
      /gross\s*earnings\b/i,
      /total\s*gross\b/i,
      /total\s*earnings\b/i,
    ],
  },
  {
    key: "tax",
    variants: [
      /payg\s*withholding\b/i,
      /tax\s*withheld\b/i,
      /income\s*tax\b/i,
      /\bpayg\b/i,
      /\btax\b/i,
    ],
  },
  {
    key: "fuelAllowance",
    variants: [
      /fuel\s*allowance\b/i,
      /car\s*allowance\b/i,
      /motor\s*vehicle\s*allowance\b/i,
      /travel\s*allowance\b/i,
      /\bfuel\b/i,
    ],
  },
  {
    key: "mealAllowance",
    variants: [/meal\s*allowance\b/i, /meal\s*money\b/i, /\bmeals?\b/i],
  },
  {
    key: "superannuation",
    variants: [
      /superannuation\b/i,
      /super\s*guarantee\b/i,
      /employer\s*super\s*contribution\b/i,
      /\bsuper\b/i,
      /\bSGC?\b/,
    ],
  },
];

// ---- dates ----

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// Trailing (?!\d) instead of \b: in column layouts dates run straight into the
// next label ("05/07/2026Payment Date"), where \b would not match.
const DATE_NUM_RE = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4}|\d{2})(?!\d)/g;
const DATE_TEXT_RE =
  /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})(?!\d)/gi;

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** All dates found in a string, in order of appearance. Australian day-first. */
export function findDates(text: string): string[] {
  const hits: { index: number; date: string }[] = [];

  for (const m of text.matchAll(DATE_NUM_RE)) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    const date = iso(year, month, day);
    if (date) hits.push({ index: m.index, date });
  }
  for (const m of text.matchAll(DATE_TEXT_RE)) {
    const date = iso(Number(m[3]), MONTHS[m[2].toLowerCase()], Number(m[1]));
    if (date) hits.push({ index: m.index, date });
  }

  return hits.sort((a, b) => a.index - b.index).map((h) => h.date);
}

const PERIOD_START_RE = /(?:pay\s*)?period\s*start(?:ing)?\b/i;
const PERIOD_END_RE = /(?:pay\s*)?period\s*end(?:ing)?\b/i;
const PAY_PERIOD_RE = /pay\s*period\b/i;
const RANGE_SEP_RE =
  /(\d{4}|\d{2})\s*(?:-|–|—|to)\s*\d{1,2}[/\-.\s]/i;

export function parsePayslip(text: string): ExtractedFields {
  const result: ExtractedFields = {
    periodStart: null,
    periodEnd: null,
    netPay: null,
    grossPay: null,
    tax: null,
    fuelAllowance: null,
    mealAllowance: null,
    superannuation: null,
    labels: {},
  };

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // ---- amounts ----
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const field of AMOUNT_FIELDS) {
      if (result[field.key] !== null) continue;
      for (const variant of field.variants) {
        const labelMatch = line.match(variant);
        if (!labelMatch) continue;

        // Prefer the first amount after the label, then any on the line;
        // in column layouts the amounts land on the next (numbers-only) line.
        let cents =
          firstAmount(line.slice(labelMatch.index! + labelMatch[0].length)) ??
          firstAmount(line);
        if (cents === null) {
          const next = lines[i + 1];
          if (next && NUMERIC_LINE_RE.test(next)) cents = firstAmount(next);
        }
        if (cents === null) continue;

        result[field.key] = cents;
        result.labels[field.key] = labelMatch[0].trim();
        break;
      }
    }
  }

  // ---- pay period ----
  for (const line of lines) {
    if (result.periodStart === null && PERIOD_START_RE.test(line)) {
      const startLabel = line.match(PERIOD_START_RE)!;
      const dates = findDates(line.slice(startLabel.index! + startLabel[0].length));
      if (dates.length > 0) {
        result.periodStart = dates[0];
        result.labels.period ??= startLabel[0].trim();
        // A "Pay Period Start ... End ..." line may carry both dates.
        if (result.periodEnd === null && dates.length > 1 && PERIOD_END_RE.test(line)) {
          result.periodEnd = dates[dates.length - 1];
        }
        continue;
      }
    }
    if (result.periodEnd === null && PERIOD_END_RE.test(line)) {
      const endLabel = line.match(PERIOD_END_RE)!;
      const dates = findDates(line.slice(endLabel.index! + endLabel[0].length));
      if (dates.length > 0) {
        result.periodEnd = dates[0];
        result.labels.period ??= endLabel[0].trim();
      }
    }
  }

  if (result.periodStart === null && result.periodEnd === null) {
    // "Pay Period: <date> - <date>" (or a single date, treated as the end date)
    for (const line of lines) {
      const label = line.match(PAY_PERIOD_RE);
      if (!label) continue;
      const dates = findDates(line);
      if (dates.length >= 2) {
        result.periodStart = dates[0];
        result.periodEnd = dates[1];
        result.labels.period = label[0].trim();
        break;
      }
      if (dates.length === 1) {
        result.periodEnd = dates[0];
        result.labels.period = label[0].trim();
        break;
      }
    }
  }

  if (result.periodStart === null && result.periodEnd === null) {
    // Bare date range anywhere, e.g. "01/06/2026 - 14/06/2026"
    for (const line of lines) {
      if (!RANGE_SEP_RE.test(line)) continue;
      const dates = findDates(line);
      if (dates.length >= 2) {
        result.periodStart = dates[0];
        result.periodEnd = dates[1];
        result.labels.period = "Date range";
        break;
      }
    }
  }

  return result;
}
