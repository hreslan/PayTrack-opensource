import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { estimateTax, fyOf, fyLabel } from "@/lib/tax";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import SegmentedTabs from "@/components/SegmentedTabs";
import StatCard from "@/components/StatCard";
import Button from "@/components/Button";

type Line = { label: string; value: string; subtotal?: boolean };

export default async function TaxReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [payslips, deductions, otherIncome] = await Promise.all([
    prisma.payslip.findMany({ where: { userId: session.user.id } }),
    prisma.deduction.findMany({ where: { userId: session.user.id } }),
    prisma.otherIncome.findMany({ where: { userId: session.user.id } }),
  ]);

  // Which financial years have any data?
  const years = [
    ...new Set([
      ...payslips.map((p) => fyOf(p.periodEnd ?? p.periodStart ?? p.createdAt)),
      ...deductions.map((d) => fyOf(d.date ?? d.createdAt)),
      ...otherIncome.map((i) => fyOf(i.date ?? i.createdAt)),
      fyOf(new Date()),
    ]),
  ].sort((a, b) => b - a);

  const { fy: fyParam } = await searchParams;
  const requested = Number(fyParam);
  const fy = years.includes(requested) ? requested : years[0];

  const fySlips = payslips.filter(
    (p) => fyOf(p.periodEnd ?? p.periodStart ?? p.createdAt) === fy
  );
  const fyDeductions = deductions.filter((d) => fyOf(d.date ?? d.createdAt) === fy);
  const fyIncome = otherIncome.filter((i) => fyOf(i.date ?? i.createdAt) === fy);

  const gross = fySlips.reduce((acc, p) => acc + (p.grossPay ?? 0), 0);
  const payslipWithheld = fySlips.reduce((acc, p) => acc + (p.tax ?? 0), 0);
  const other = fyIncome.reduce((acc, i) => acc + i.amount, 0);
  const otherWithheld = fyIncome.reduce((acc, i) => acc + (i.tax ?? 0), 0);
  const withheld = payslipWithheld + otherWithheld;
  const deducted = fyDeductions.reduce((acc, d) => acc + d.amount, 0);
  const totalIncome = gross + other;
  const taxable = Math.max(0, totalIncome - deducted);
  const est = estimateTax(taxable);
  const outcome = withheld - est.netTax; // positive → refund, negative → owing
  const refund = outcome >= 0;
  const hasData =
    fySlips.length > 0 || fyDeductions.length > 0 || fyIncome.length > 0;

  const lines: Line[] = [
    { label: "Gross income from payslips", value: formatMoney(gross) },
    ...(other > 0
      ? [
          { label: "Other income", value: `+ ${formatMoney(other)}` },
          { label: "Total income", value: formatMoney(totalIncome), subtotal: true },
        ]
      : []),
    { label: "Less deductions", value: `− ${formatMoney(deducted)}` },
    { label: "Taxable income", value: formatMoney(taxable), subtotal: true },
    { label: "Income tax on that", value: formatMoney(est.incomeTax) },
    { label: "Low income tax offset", value: `− ${formatMoney(est.lito)}` },
    { label: "Medicare levy", value: `+ ${formatMoney(est.medicare)}` },
    {
      label: "Estimated tax for the year",
      value: formatMoney(est.netTax),
      subtotal: true,
    },
    ...(otherWithheld > 0
      ? [
          { label: "Tax withheld on payslips", value: formatMoney(payslipWithheld) },
          { label: "Tax withheld on other income", value: formatMoney(otherWithheld) },
        ]
      : []),
    { label: "Tax already withheld", value: formatMoney(withheld), subtotal: true },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Tax return estimate"
        description={`Worked out from your saved payslips, other income and deductions for the ${fyLabel(fy)} financial year.`}
      >
        <SegmentedTabs
          items={years.map((y) => ({
            href: y === years[0] ? "/tax-return" : `/tax-return?fy=${y}`,
            label: fyLabel(y),
            active: y === fy,
          }))}
        />
      </PageHeader>

      {!hasData ? (
        <Card className="mt-6 flex flex-col items-center gap-4 py-14 text-center">
          <p className="max-w-sm text-sm text-muted">
            Nothing to estimate yet for {fyLabel(fy)}. Upload payslips, add
            other income and deductions, and the estimate appears here.
          </p>
          <Button href="/upload">Upload a payslip</Button>
        </Card>
      ) : (
        <>
          <Card
            className={`mt-6 flex flex-wrap items-start justify-between gap-6 border-l-4 ${
              refund ? "border-l-positive" : "border-l-negative"
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {refund ? "Estimated refund" : "Estimated tax still owing"}
              </p>
              <p
                className={`mt-2 text-4xl font-semibold tracking-tight tabular-nums ${
                  refund ? "text-positive" : "text-negative"
                }`}
              >
                {formatMoney(Math.abs(outcome))}
              </p>
              <p className="mt-3 max-w-md text-xs leading-relaxed text-muted">
                Estimate only — based on resident tax rates, the Medicare levy
                and the low income tax offset. It ignores HELP debt, private
                health cover and anything else on your actual return.
              </p>
            </div>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Tax withheld</dt>
                <dd className="font-medium tabular-nums text-ink">
                  {formatMoney(withheld)}
                </dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Estimated tax for the year</dt>
                <dd className="font-medium tabular-nums text-ink">
                  {formatMoney(est.netTax)}
                </dd>
              </div>
            </dl>
          </Card>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={other > 0 ? "Total income" : "Income (gross pay)"}
              value={formatMoney(totalIncome)}
            />
            <StatCard label="Deductions claimed" value={formatMoney(deducted)} />
            <StatCard label="Taxable income" value={formatMoney(taxable)} />
            <StatCard
              label="Tax + Medicare levy"
              value={formatMoney(est.netTax)}
              meterPercent={taxable > 0 ? (est.netTax / taxable) * 100 : 0}
              sub={
                taxable > 0
                  ? `${((est.netTax / taxable) * 100).toFixed(1)}% effective rate`
                  : undefined
              }
            />
          </div>

          <Card className="mt-4">
            <h2 className="text-sm font-semibold text-ink">How it&apos;s worked out</h2>
            <table className="mt-3 w-full border-collapse">
              <tbody>
                {lines.map((line) => (
                  <tr key={line.label} className="border-t border-line">
                    <td
                      className={`py-2 pr-4 text-sm ${
                        line.subtotal ? "font-medium text-ink" : "text-muted"
                      }`}
                    >
                      {line.label}
                    </td>
                    <td
                      className={`py-2 text-right text-sm tabular-nums ${
                        line.subtotal ? "font-semibold text-ink" : "text-ink-soft"
                      }`}
                    >
                      {line.value}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-line-strong">
                  <td className="py-3 pr-4 text-sm font-semibold text-ink">
                    {refund ? "Estimated refund" : "Estimated tax owing"}
                  </td>
                  <td
                    className={`py-3 text-right text-base font-semibold tabular-nums ${
                      refund ? "text-positive" : "text-negative"
                    }`}
                  >
                    {formatMoney(Math.abs(outcome))}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-sm text-muted">
              {refund
                ? "You've had more withheld than the estimated tax, so that difference would come back to you."
                : "Less has been withheld than the estimated tax, so that difference would be payable."}
            </p>
          </Card>
        </>
      )}
    </AppShell>
  );
}
