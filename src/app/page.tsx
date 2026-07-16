import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import StatCard from "@/components/StatCard";
import PillButton from "@/components/PillButton";
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

  const payslips = await prisma.payslip.findMany({
    where: { userId: session.user.id },
    orderBy: [{ periodEnd: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });

  // Australian financial year: 1 July – 30 June.
  const now = new Date();
  const fyStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const fyStart = new Date(Date.UTC(fyStartYear, 6, 1));
  const inFy = payslips.filter(
    (p) => (p.periodEnd ?? p.periodStart ?? p.createdAt) >= fyStart
  );
  const sum = (values: (number | null)[]) =>
    values.reduce<number>((acc, v) => acc + (v ?? 0), 0);

  const totalNet = sum(inFy.map((p) => p.netPay));
  const totalTax = sum(inFy.map((p) => p.tax));
  const totalSuper = sum(inFy.map((p) => p.superannuation));
  const totalGross = sum(inFy.map((p) => p.grossPay));
  const superPercent = totalGross > 0 ? (totalSuper / totalGross) * 100 : 0;

  const rows: PayslipRow[] = payslips.map((p) => ({
    id: p.id,
    period: formatPeriod(p.periodStart, p.periodEnd),
    net: formatMoney(p.netPay),
    gross: formatMoney(p.grossPay),
    tax: formatMoney(p.tax),
    fuel: formatMoney(p.fuelAllowance),
    meal: formatMoney(p.mealAllowance),
    superann: formatMoney(p.superannuation),
  }));

  const dayNumber = now.toLocaleDateString("en-AU", { day: "numeric" });
  const weekday = now.toLocaleDateString("en-AU", { weekday: "short" });
  const month = now.toLocaleDateString("en-AU", { month: "long" });

  return (
    <AppShell>
      {/* Greeting row */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="flex size-16 items-center justify-center rounded-full border border-ink/15 text-2xl font-bold text-ink">
              {dayNumber}
            </span>
            <span className="text-sm leading-snug text-muted">
              {weekday},
              <br />
              {month}
            </span>
          </div>
          <PillButton href="/upload" arrow>
            Upload payslip
          </PillButton>
        </div>
        <div className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl lg:text-right">
          <p className="text-ink">Hey, need your payslips?</p>
          <p className="text-muted">Everything you confirmed lives here.</p>
        </div>
      </div>

      {payslips.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-4 py-14 text-center">
          <p className="max-w-sm text-sm text-muted">
            Nothing here yet. Upload a payslip PDF, check the figures we read
            from it, and it will show up on any device you log in from.
          </p>
          <PillButton href="/upload" arrow>
            Upload your first payslip
          </PillButton>
        </Card>
      ) : (
        <>
          {/* Stat cards for the current financial year */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total net pay this year" value={formatMoney(totalNet)} />
            <StatCard label="Total tax this year" value={formatMoney(totalTax)} />
            <StatCard label="Total super this year" value={formatMoney(totalSuper)} />
            <StatCard
              label="Super as % of gross"
              value={formatMoney(totalSuper)}
              ringPercent={superPercent}
            />
          </div>

          <div className="mt-6">
            <PayslipList rows={rows} />
          </div>
        </>
      )}
    </AppShell>
  );
}
