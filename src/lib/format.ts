/** cents → "$1,234.56" for display */
export function formatMoney(cents: number | null): string {
  if (cents === null) return "—";
  return (cents / 100).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    currencyDisplay: "narrowSymbol",
  });
}

/** cents → "1234.56" for form inputs ("" when null) */
export function centsToInput(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2);
}

/** "1,234.56" / "$1,234.56" / "" → integer cents, null when blank, NaN sentinel via undefined when invalid */
export function parseMoneyInput(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const cleaned = trimmed.replace(/[$,\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return undefined;
  return Math.round(Number(cleaned) * 100);
}

export function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Date → "yyyy-mm-dd" for <input type="date"> */
export function dateToInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}
