import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { fyOf, fyLabel } from "@/lib/tax";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
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

  const rows: DeductionRow[] = deductions.map((d) => ({
    id: d.id,
    date: formatDate(d.date),
    description: d.description,
    category: d.category,
    amount: formatMoney(d.amount),
  }));

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Deductions
          </h1>
          <p className="mt-1 text-sm text-muted">
            Work expenses you can claim. They reduce your taxable income in the
            tax return estimate.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-muted">
            Claimed this year ({fyLabel(currentFy)})
          </p>
          <p className="text-2xl font-bold tracking-tight text-ink">
            {formatMoney(thisFyTotal)}
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-bold tracking-tight text-ink">
          Add a deduction
        </h2>
        <DeductionForm />
      </Card>

      <Card className="mt-6">
        <h2 className="mb-2 text-lg font-bold tracking-tight text-ink">
          Your deductions
        </h2>
        <DeductionList rows={rows} />
      </Card>
    </AppShell>
  );
}
