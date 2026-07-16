import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { availableYears, loadExport, parseScope } from "@/lib/export-data";
import { fyLabel } from "@/lib/tax";
import { formatMoney } from "@/lib/format";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PillButton, { Arrow } from "@/components/PillButton";

export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const years = await availableYears(session.user.id);
  const { fy } = await searchParams;
  const scope = parseScope(fy, years);
  const { payslips, deductions } = await loadExport(session.user.id, scope);

  const scopeParam = scope === "all" ? "all" : String(scope);
  const scopeLabel = scope === "all" ? "all years" : `FY ${fyLabel(scope)}`;
  const deductionTotal = deductions.reduce((acc, d) => acc + d.amount, 0);

  const chips: { value: string; label: string }[] = [
    ...years.map((y) => ({ value: String(y), label: `FY ${fyLabel(y)}` })),
    { value: "all", label: "All time" },
  ];

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Accountant export
        </h1>
        <p className="mt-1 text-sm text-muted">
          Clean reports to hand your tax agent or load into Xero, QuickBooks or
          any accounting software.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active =
            chip.value === scopeParam ||
            (chip.value === String(years[0]) && scope === years[0] && !fy);
          return (
            <Link
              key={chip.value}
              href={
                chip.value === String(years[0]) ? "/export" : `/export?fy=${chip.value}`
              }
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-ink/10 bg-card text-ink hover:border-ink/30"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Printable report
          </h2>
          <p className="mt-1 mb-5 flex-1 text-sm text-muted">
            A tidy one-page summary for {scopeLabel} — income, tax estimate and
            categorised deductions. Opens ready to print or save as PDF.
          </p>
          <PillButton href={`/export/report?fy=${scopeParam}`} arrow>
            Open report
          </PillButton>
        </Card>

        <Card className="flex flex-col">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Payslips (CSV)
          </h2>
          <p className="mt-1 mb-5 flex-1 text-sm text-muted">
            {payslips.length} payslip{payslips.length === 1 ? "" : "s"} for{" "}
            {scopeLabel}. Columns for gross, PAYG, net, allowances and super.
          </p>
          <a
            href={`/api/export/payslips?fy=${scopeParam}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Download CSV
            <Arrow />
          </a>
        </Card>

        <Card className="flex flex-col">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Deductions (CSV)
          </h2>
          <p className="mt-1 mb-5 flex-1 text-sm text-muted">
            {deductions.length} deduction{deductions.length === 1 ? "" : "s"}{" "}
            totalling {formatMoney(deductionTotal)} for {scopeLabel}. Date,
            description, category and amount.
          </p>
          <a
            href={`/api/export/deductions?fy=${scopeParam}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Download CSV
            <Arrow />
          </a>
        </Card>
      </div>
    </AppShell>
  );
}
