import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { fyLabel, fyOf } from "@/lib/tax";
import { monthlyTotals } from "@/lib/fy-months";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Button from "@/components/Button";
import MonthlyBarChart from "@/components/MonthlyBarChart";
import PayslipList, { type PayslipRow } from "@/components/PayslipList";

function formatPeriod(start: Date | null, end: Date | null): string {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (end) return `Ending ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  return "No period";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [payslips, otherIncome] = await Promise.all([
    prisma.payslip.findMany({
      where: { userId: session.user.id },
      orderBy: [{ periodEnd: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    }),
    prisma.otherIncome.findMany({ where: { userId: session.user.id } }),
  ]);

  const fy = fyOf(new Date());
  const dateOf = (p: {
    periodEnd: Date | null;
    periodStart: Date | null;
    createdAt: Date;
  }) => p.periodEnd ?? p.periodStart ?? p.createdAt;

  const inFy = payslips.filter((p) => fyOf(dateOf(p)) === fy);
  const incomeInFy = otherIncome.filter((i) => fyOf(i.date ?? i.createdAt) === fy);
  const sum = (values: (number | null)[]) =>
    values.reduce<number>((acc, v) => acc + (v ?? 0), 0);

  // Other income counts towards the year's totals: what you keep from it is the
  // amount less any tax withheld, and that tax joins the tax total.
  const otherAmount = sum(incomeInFy.map((i) => i.amount));
  const otherTax = sum(incomeInFy.map((i) => i.tax));

  const totalNet = sum(inFy.map((p) => p.netPay)) + otherAmount - otherTax;
  const totalTax = sum(inFy.map((p) => p.tax)) + otherTax;
  const totalSuper = sum(inFy.map((p) => p.superannuation));
  const totalGross = sum(inFy.map((p) => p.grossPay)) + otherAmount;
  const superPercent = totalGross > 0 ? (totalSuper / totalGross) * 100 : 0;
  const taxPercent = totalGross > 0 ? (totalTax / totalGross) * 100 : 0;

  const monthly = monthlyTotals(
    [
      ...inFy.map((p) => ({ date: dateOf(p), amount: p.netPay ?? 0 })),
      ...incomeInFy.map((i) => ({
        date: i.date ?? i.createdAt,
        amount: i.amount - (i.tax ?? 0),
      })),
    ],
    fy
  );

  const rows: PayslipRow[] = payslips.map((p) => ({
    id: p.id,
    period: formatPeriod(p.periodStart, p.periodEnd),
    net: formatMoney(p.netPay),
    gross: formatMoney(p.grossPay),
    tax: formatMoney(p.tax),
    fuel: formatMoney(p.fuelAllowance),
    meal: formatMoney(p.mealAllowance),
    superann: formatMoney(p.superannuation),
    sort: {
      period: dateOf(p).getTime(),
      net: p.netPay ?? 0,
      gross: p.grossPay ?? 0,
      tax: p.tax ?? 0,
      superann: p.superannuation ?? 0,
    },
  }));

  const isEmpty = payslips.length === 0 && otherIncome.length === 0;

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description={`Your pay, tax and super for the ${fyLabel(fy)} financial year (1 July – 30 June).`}
      >
        <Button href="/upload">Upload payslip</Button>
      </PageHeader>

      {isEmpty ? (
        <Card className="mt-6 flex flex-col items-center gap-4 py-14 text-center">
          <p className="max-w-sm text-sm text-muted">
            Nothing here yet. Upload a payslip PDF, check the figures we read
            from it, and it will show up on any device you log in from.
          </p>
          <Button href="/upload">Upload your first payslip</Button>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Net income"
              value={formatMoney(totalNet)}
              sub={`Take-home from ${inFy.length} payslip${inFy.length === 1 ? "" : "s"}`}
            />
            <StatCard
              label="Gross income"
              value={formatMoney(totalGross)}
              sub="Before tax and deductions"
            />
            <StatCard
              label="Tax withheld"
              value={formatMoney(totalTax)}
              sub={`${taxPercent.toFixed(1)}% of gross income`}
            />
            <StatCard
              label="Superannuation"
              value={formatMoney(totalSuper)}
              meterPercent={superPercent}
              sub={`${superPercent.toFixed(1)}% of gross income`}
            />
          </div>

          {otherAmount > 0 && (
            <p className="mt-3 text-xs text-muted">
              Includes {formatMoney(otherAmount)} of{" "}
              <Link
                href="/income"
                className="font-medium text-accent underline underline-offset-4"
              >
                other income
              </Link>
              {otherTax > 0 ? `, with ${formatMoney(otherTax)} tax withheld on it` : ""}.
            </p>
          )}

          <div className="mt-4">
            <MonthlyBarChart
              title="Net income by month"
              data={monthly}
              note={`What you kept each month of ${fyLabel(fy)}, after tax.`}
            />
          </div>

          {payslips.length > 0 && (
            <div className="mt-4">
              <PayslipList rows={rows} />
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
