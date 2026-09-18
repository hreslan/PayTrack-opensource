import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { fyOf, fyLabel } from "@/lib/tax";
import { monthlyTotals } from "@/lib/fy-months";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import MonthlyBarChart from "@/components/MonthlyBarChart";
import IncomeForm from "@/components/IncomeForm";
import IncomeList, { type IncomeRow } from "@/components/IncomeList";

export default async function IncomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const income = await prisma.otherIncome.findMany({
    where: { userId: session.user.id },
    orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });

  const currentFy = fyOf(new Date());
  const thisFyTotal = income
    .filter((i) => fyOf(i.date ?? i.createdAt) === currentFy)
    .reduce((acc, i) => acc + i.amount, 0);

  const monthly = monthlyTotals(
    income.map((i) => ({ date: i.date ?? i.createdAt, amount: i.amount })),
    currentFy
  );

  const rows: IncomeRow[] = income.map((i) => ({
    id: i.id,
    date: formatDate(i.date),
    description: i.description,
    category: i.category,
    amount: formatMoney(i.amount),
    tax: i.tax === null ? null : formatMoney(i.tax),
    sort: {
      date: (i.date ?? i.createdAt).getTime(),
      description: i.description.toLowerCase(),
      category: i.category.toLowerCase(),
      amount: i.amount,
      tax: i.tax ?? 0,
    },
  }));

  return (
    <AppShell>
      <PageHeader
        title="Other income"
        description="Money you earned outside your payslips — interest, dividends, side work. It adds to your taxable income in the tax return estimate."
      >
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Earned in {fyLabel(currentFy)}
          </p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-ink">
            {formatMoney(thisFyTotal)}
          </p>
        </div>
      </PageHeader>

      <div className="mt-6">
        <MonthlyBarChart
          title="Other income by month"
          data={monthly}
          note={`What you earned outside payslips each month of ${fyLabel(currentFy)}.`}
        />
      </div>

      <Card className="mt-4">
        <h2 className="mb-4 text-sm font-semibold text-ink">Add other income</h2>
        <IncomeForm />
      </Card>

      <Card className="mt-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Your other income{" "}
          <span className="ml-1 font-normal tabular-nums text-muted">
            {rows.length}
          </span>
        </h2>
        <IncomeList rows={rows} />
      </Card>
    </AppShell>
  );
}
