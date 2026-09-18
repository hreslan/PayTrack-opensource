import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { availableYears, loadExport, parseScope } from "@/lib/export-data";
import { fyLabel } from "@/lib/tax";
import { formatMoney } from "@/lib/format";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import SegmentedTabs from "@/components/SegmentedTabs";
import Button, { Arrow, buttonClasses } from "@/components/Button";

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
  const { payslips, deductions, otherIncome } = await loadExport(
    session.user.id,
    scope
  );

  const scopeParam = scope === "all" ? "all" : String(scope);
  const scopeLabel = scope === "all" ? "all years" : `FY ${fyLabel(scope)}`;
  const deductionTotal = deductions.reduce((acc, d) => acc + d.amount, 0);
  const incomeTotal = otherIncome.reduce((acc, i) => acc + i.amount, 0);

  const segments = [
    ...years.map((y) => ({
      href: y === years[0] ? "/export" : `/export?fy=${y}`,
      label: fyLabel(y),
      active: scopeParam === String(y),
    })),
    { href: "/export?fy=all", label: "All time", active: scope === "all" },
  ];

  const csvExports = [
    {
      title: "Payslips",
      href: `/api/export/payslips?fy=${scopeParam}`,
      description: `${payslips.length} payslip${payslips.length === 1 ? "" : "s"} for ${scopeLabel}. Columns for gross, PAYG, net, allowances and super.`,
    },
    {
      title: "Deductions",
      href: `/api/export/deductions?fy=${scopeParam}`,
      description: `${deductions.length} deduction${deductions.length === 1 ? "" : "s"} totalling ${formatMoney(deductionTotal)} for ${scopeLabel}. Date, description, category and amount.`,
    },
    {
      title: "Other income",
      href: `/api/export/income?fy=${scopeParam}`,
      description: `${otherIncome.length} entr${otherIncome.length === 1 ? "y" : "ies"} totalling ${formatMoney(incomeTotal)} for ${scopeLabel}. Date, source, category, amount and tax withheld.`,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Accountant export"
        description="Clean reports to hand your tax agent or load into Xero, QuickBooks or any accounting software."
      >
        <SegmentedTabs items={segments} />
      </PageHeader>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col">
          <h2 className="text-sm font-semibold text-ink">Printable report</h2>
          <p className="mb-5 mt-1.5 flex-1 text-sm text-muted">
            A tidy one-page summary for {scopeLabel} — income, other income, tax
            estimate and categorised deductions. Opens ready to print or save as
            PDF.
          </p>
          <Button href={`/export/report?fy=${scopeParam}`} arrow>
            Open report
          </Button>
        </Card>

        {csvExports.map((item) => (
          <Card key={item.title} className="flex flex-col">
            <h2 className="text-sm font-semibold text-ink">{item.title} (CSV)</h2>
            <p className="mb-5 mt-1.5 flex-1 text-sm text-muted">{item.description}</p>
            <a href={item.href} className={buttonClasses("tertiary")}>
              Download CSV
              <Arrow />
            </a>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
