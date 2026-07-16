import { prisma } from "./prisma";
import { fyOf } from "./tax";

// Shared loader for the export pages and CSV routes. `fy` is a financial-year
// start year, or "all" for everything.

export type ExportScope = number | "all";

export function parseScope(raw: string | undefined, years: number[]): ExportScope {
  if (raw === "all") return "all";
  const n = Number(raw);
  return years.includes(n) ? n : (years[0] ?? fyOf(new Date()));
}

export async function loadExport(userId: string, scope: ExportScope) {
  const [allPayslips, allDeductions] = await Promise.all([
    prisma.payslip.findMany({
      where: { userId },
      orderBy: [{ periodEnd: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    }),
    prisma.deduction.findMany({
      where: { userId },
      orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    }),
  ]);

  const payslips =
    scope === "all"
      ? allPayslips
      : allPayslips.filter(
          (p) => fyOf(p.periodEnd ?? p.periodStart ?? p.createdAt) === scope
        );
  const deductions =
    scope === "all"
      ? allDeductions
      : allDeductions.filter((d) => fyOf(d.date ?? d.createdAt) === scope);

  return { payslips, deductions };
}

/** Every financial year the user has any data in, newest first. */
export async function availableYears(userId: string): Promise<number[]> {
  const [payslips, deductions] = await Promise.all([
    prisma.payslip.findMany({
      where: { userId },
      select: { periodStart: true, periodEnd: true, createdAt: true },
    }),
    prisma.deduction.findMany({
      where: { userId },
      select: { date: true, createdAt: true },
    }),
  ]);
  const years = new Set<number>([
    ...payslips.map((p) => fyOf(p.periodEnd ?? p.periodStart ?? p.createdAt)),
    ...deductions.map((d) => fyOf(d.date ?? d.createdAt)),
  ]);
  if (years.size === 0) years.add(fyOf(new Date()));
  return [...years].sort((a, b) => b - a);
}
