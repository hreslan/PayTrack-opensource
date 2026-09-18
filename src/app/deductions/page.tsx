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
import DeductionForm from "@/components/DeductionForm";
import DeductionList, { type DeductionRow } from "@/components/DeductionList";

export default async function DeductionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const deductions = await prisma.deduction.findMany({
    where: { userId: session.user.id },
    orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });

  const currentFy = fyOf(new Date());
  const thisFyTotal = deductions
    .filter((d) => fyOf(d.date ?? d.createdAt) === currentFy)
    .reduce((acc, d) => acc + d.amount, 0);

  const monthly = monthlyTotals(
    deductions.map((d) => ({ date: d.date ?? d.createdAt, amount: d.amount })),
    currentFy
  );

  const rows: DeductionRow[] = deductions.map((d) => ({
    id: d.id,
    date: formatDate(d.date),
    description: d.description,
    category: d.category,
    amount: formatMoney(d.amount),
    hasReceipt: d.receiptPath !== null,
    sort: {
      date: (d.date ?? d.createdAt).getTime(),
      description: d.description.toLowerCase(),
      category: d.category.toLowerCase(),
      amount: d.amount,
    },
  }));

  return (
    <AppShell>
      <PageHeader
        title="Deductions"
        description="Work expenses you can claim. They reduce your taxable income in the tax return estimate."
      >
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Claimed in {fyLabel(currentFy)}
          </p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-ink">
            {formatMoney(thisFyTotal)}
          </p>
        </div>
      </PageHeader>

      <div className="mt-6">
        <MonthlyBarChart
          title="Deductions by month"
          data={monthly}
          note={`What you claimed each month of ${fyLabel(currentFy)}.`}
        />
      </div>

      <Card className="mt-4">
        <h2 className="mb-4 text-sm font-semibold text-ink">Add a deduction</h2>
        <DeductionForm />
      </Card>

      <Card className="mt-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Your deductions{" "}
          <span className="ml-1 font-normal tabular-nums text-muted">
            {rows.length}
          </span>
        </h2>
        <DeductionList rows={rows} />
      </Card>
    </AppShell>
  );
}
