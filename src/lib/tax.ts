// Australian resident income tax estimate, in integer cents.
// Uses the 2026-27 rates (1 July 2026 to 30 June 2027):
//   $0 – $18,200          nil (tax-free threshold)
//   $18,201 – $45,000     15%
//   $45,001 – $135,000    $4,020 + 30% of excess over $45,000
//   $135,001 – $190,000   $31,020 + 37% of excess over $135,000
//   $190,001+             $51,370 + 45% of excess over $190,000
// Plus the 2% Medicare levy (phased in above the low-income threshold) and
// the Low Income Tax Offset. This is an estimate only — it ignores HELP
// debts, private health insurance, other offsets and levy exemptions.

const MEDICARE_THRESHOLD = 27_222_00;

export type TaxEstimate = {
  incomeTax: number;
  lito: number;
  medicare: number;
  /** what the year's tax actually is: max(0, incomeTax - lito) + medicare */
  netTax: number;
};

function baseIncomeTax(c: number): number {
  if (c <= 18_200_00) return 0;
  if (c <= 45_000_00) return 0.15 * (c - 18_200_00);
  if (c <= 135_000_00) return 4_020_00 + 0.3 * (c - 45_000_00);
  if (c <= 190_000_00) return 31_020_00 + 0.37 * (c - 135_000_00);
  return 51_370_00 + 0.45 * (c - 190_000_00);
}

function litoOffset(c: number): number {
  if (c <= 37_500_00) return 700_00;
  if (c <= 45_000_00) return 700_00 - 0.05 * (c - 37_500_00);
  if (c <= 66_667_00) return 325_00 - 0.015 * (c - 45_000_00);
  return 0;
}

function medicareLevy(c: number): number {
  if (c <= MEDICARE_THRESHOLD) return 0;
  return Math.min(0.02 * c, 0.1 * (c - MEDICARE_THRESHOLD));
}

/** All inputs and outputs are integer cents. */
export function estimateTax(taxableIncome: number): TaxEstimate {
  const c = Math.max(0, taxableIncome);
  const incomeTax = Math.round(baseIncomeTax(c));
  const lito = Math.round(Math.max(0, litoOffset(c)));
  const medicare = Math.round(medicareLevy(c));
  const netTax = Math.max(0, incomeTax - lito) + medicare;
  return { incomeTax, lito, medicare, netTax };
}

/** Financial year a date falls in, as its starting calendar year (FY 2025–26 → 2025). */
export function fyOf(date: Date): number {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

export function fyLabel(fyStartYear: number): string {
  return `${fyStartYear}–${String(fyStartYear + 1).slice(2)}`;
}
