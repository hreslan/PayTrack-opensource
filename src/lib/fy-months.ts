import { fyOf } from "./tax";

export type MonthPoint = { label: string; full: string; value: number };

const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Calendar month indices in Australian financial-year order: July → June. */
const FY_ORDER = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];

/** Totals each month of one financial year, in FY order, as integer cents. */
export function monthlyTotals(
  items: { date: Date; amount: number }[],
  fyStartYear: number
): MonthPoint[] {
  const totals = new Array(12).fill(0);

  for (const item of items) {
    if (fyOf(item.date) !== fyStartYear) continue;
    const slot = FY_ORDER.indexOf(item.date.getMonth());
    totals[slot] += item.amount;
  }

  return FY_ORDER.map((month, slot) => ({
    label: SHORT[month],
    full: `${FULL[month]} ${month >= 6 ? fyStartYear : fyStartYear + 1}`,
    value: totals[slot],
  }));
}
