import { Fragment } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { availableYears, loadExport, parseScope } from "@/lib/export-data";
import { estimateTax, fyLabel } from "@/lib/tax";
import { formatMoney, formatDate } from "@/lib/format";
import { DEDUCTION_CATEGORIES } from "@/lib/deduction-categories";
import { INCOME_CATEGORIES } from "@/lib/income-categories";
import PrintButton from "@/components/PrintButton";

const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line-strong";
const thr = `${th} text-right`;
const td = "px-3 py-2 text-sm text-ink border-b border-line";
const tdr = "px-3 py-2 text-right text-sm tabular-nums text-ink border-b border-line";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, displayName: true },
  });
  if (!user) redirect("/login");

  const years = await availableYears(session.user.id);
  const { fy } = await searchParams;
  const scope = parseScope(fy, years);
  const { payslips, deductions, otherIncome } = await loadExport(
    session.user.id,
    scope
  );

  const scopeLabel = scope === "all" ? "All years" : `FY ${fyLabel(scope)}`;
  const preparedFor = user.displayName || user.email;
  const generated = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const gross = payslips.reduce((a, p) => a + (p.grossPay ?? 0), 0);
  const payslipWithheld = payslips.reduce((a, p) => a + (p.tax ?? 0), 0);
  const superTotal = payslips.reduce((a, p) => a + (p.superannuation ?? 0), 0);
  const deducted = deductions.reduce((a, d) => a + d.amount, 0);
  const other = otherIncome.reduce((a, i) => a + i.amount, 0);
  const otherWithheld = otherIncome.reduce((a, i) => a + (i.tax ?? 0), 0);
  const withheld = payslipWithheld + otherWithheld;
  const totalIncome = gross + other;
  const taxable = Math.max(0, totalIncome - deducted);
  const est = estimateTax(taxable);
  const outcome = withheld - est.netTax;

  // deductions grouped by category, in the canonical category order
  const byCategory = DEDUCTION_CATEGORIES.map((category) => {
    const items = deductions.filter((d) => d.category === category);
    return { category, items, total: items.reduce((a, d) => a + d.amount, 0) };
  }).filter((g) => g.items.length > 0);

  const incomeByCategory = INCOME_CATEGORIES.map((category) => {
    const items = otherIncome.filter((i) => i.category === category);
    return {
      category,
      items,
      total: items.reduce((a, i) => a + i.amount, 0),
      tax: items.reduce((a, i) => a + (i.tax ?? 0), 0),
    };
  }).filter((g) => g.items.length > 0);

  function formatPeriod(start: Date | null, end: Date | null): string {
    if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
    if (end) return `Ending ${formatDate(end)}`;
    if (start) return `From ${formatDate(start)}`;
    return "—";
  }

  return (
    <div className="report-doc min-h-screen bg-white text-ink">
      {/* Print margins; force backgrounds/colours to print. */}
      <style>{`
        /* The report is always a light document — it prints onto white paper,
           so it pins the palette rather than following the app theme. */
        .report-doc {
          --color-surface: #ffffff;
          --color-card: #ffffff;
          --color-inset: #f4f6f8;
          --color-line: #e2e6eb;
          --color-line-strong: #c9d0d9;
          --color-ink: #0d1520;
          --color-ink-soft: #3d4855;
          --color-muted: #6b7684;
          --color-accent: #2a4fc4;
          --color-positive: #0a6c47;
          --color-negative: #a8341f;
        }
        @page { margin: 16mm; }
        @media print {
          html, body { background: #fff !important; }
          .report { box-shadow: none !important; }
          thead { display: table-header-group; }
          tr { break-inside: avoid; }
        }
      `}</style>

      <div className="print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 pt-6">
          <Link
            href={`/export?fy=${scope === "all" ? "all" : scope}`}
            className="rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            ← Back to export
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="report mx-auto max-w-3xl px-6 py-8 print:py-0">
        <header className="flex items-start justify-between gap-6 border-b-2 border-line-strong pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Tax summary report
            </h1>
            <p className="mt-1 text-sm text-muted">{scopeLabel}</p>
          </div>
          <div className="text-right text-xs text-muted">
            <p>
              Prepared for <span className="font-semibold text-ink">{preparedFor}</span>
            </p>
            <p className="mt-0.5">Generated {generated}</p>
          </div>
        </header>

        {/* Summary */}
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Summary
          </h2>
          <table className="mt-2 w-full border-collapse">
            <tbody>
              {[
                ["Gross income (from payslips)", formatMoney(gross)],
                ["Other income", `+ ${formatMoney(other)}`],
                ["Total income", formatMoney(totalIncome)],
                ["Deductions claimed", `− ${formatMoney(deducted)}`],
                ["Taxable income", formatMoney(taxable)],
                ["Income tax", formatMoney(est.incomeTax)],
                ["Low income tax offset", `− ${formatMoney(est.lito)}`],
                ["Medicare levy", `+ ${formatMoney(est.medicare)}`],
                ["Estimated tax for the year", formatMoney(est.netTax)],
                ["Tax withheld on payslips", formatMoney(payslipWithheld)],
                ...(otherWithheld > 0
                  ? [["Tax withheld on other income", formatMoney(otherWithheld)]]
                  : []),
                ["Superannuation (employer)", formatMoney(superTotal)],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className={td}>{label}</td>
                  <td className={`${tdr} font-semibold`}>{value}</td>
                </tr>
              ))}
              <tr>
                <td className="px-3 py-2.5 text-sm font-bold text-ink">
                  {outcome >= 0 ? "Estimated refund" : "Estimated tax owing"}
                </td>
                <td className={`px-3 py-2.5 text-right text-base font-bold tabular-nums ${outcome >= 0 ? "text-positive" : "text-negative"}`}>
                  {formatMoney(Math.abs(outcome))}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Payslips */}
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Payslips ({payslips.length})
          </h2>
          {payslips.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No payslips for this period.</p>
          ) : (
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Pay period</th>
                  <th className={thr}>Gross</th>
                  <th className={thr}>PAYG</th>
                  <th className={thr}>Net</th>
                  <th className={thr}>Super</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>{formatPeriod(p.periodStart, p.periodEnd)}</td>
                    <td className={tdr}>{formatMoney(p.grossPay)}</td>
                    <td className={tdr}>{formatMoney(p.tax)}</td>
                    <td className={tdr}>{formatMoney(p.netPay)}</td>
                    <td className={tdr}>{formatMoney(p.superannuation)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-3 py-2 text-sm font-bold text-ink">Total</td>
                  <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-ink">
                    {formatMoney(gross)}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-ink">
                    {formatMoney(payslipWithheld)}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-ink">
                    {formatMoney(payslips.reduce((a, p) => a + (p.netPay ?? 0), 0))}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-ink">
                    {formatMoney(superTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        {/* Other income by category */}
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Other income ({otherIncome.length})
          </h2>
          {otherIncome.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              No income outside payslips for this period.
            </p>
          ) : (
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Source</th>
                  <th className={thr}>Amount</th>
                  <th className={thr}>Tax withheld</th>
                </tr>
              </thead>
              <tbody>
                {incomeByCategory.map((group) => (
                  <Fragment key={group.category}>
                    <tr>
                      <td
                        colSpan={2}
                        className="bg-inset px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink"
                      >
                        {group.category}
                      </td>
                      <td className="bg-inset px-3 py-1.5 text-right text-xs font-bold text-ink">
                        {formatMoney(group.total)}
                      </td>
                      <td className="bg-inset px-3 py-1.5 text-right text-xs font-bold text-ink">
                        {formatMoney(group.tax)}
                      </td>
                    </tr>
                    {group.items.map((i) => (
                      <tr key={i.id}>
                        <td className={td}>{formatDate(i.date)}</td>
                        <td className={td}>{i.description}</td>
                        <td className={tdr}>{formatMoney(i.amount)}</td>
                        <td className={tdr}>{formatMoney(i.tax)}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-sm font-bold text-ink">
                    Total other income
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-ink">
                    {formatMoney(other)}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-ink">
                    {formatMoney(otherWithheld)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        {/* Deductions by category */}
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Deductions ({deductions.length})
          </h2>
          {deductions.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No deductions for this period.</p>
          ) : (
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Item</th>
                  <th className={thr}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((group) => (
                  <Fragment key={group.category}>
                    <tr>
                      <td
                        colSpan={2}
                        className="bg-inset px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink"
                      >
                        {group.category}
                      </td>
                      <td className="bg-inset px-3 py-1.5 text-right text-xs font-bold text-ink">
                        {formatMoney(group.total)}
                      </td>
                    </tr>
                    {group.items.map((d) => (
                      <tr key={d.id}>
                        <td className={td}>{formatDate(d.date)}</td>
                        <td className={td}>{d.description}</td>
                        <td className={tdr}>{formatMoney(d.amount)}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-sm font-bold text-ink">
                    Total deductions
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-ink">
                    {formatMoney(deducted)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        <footer className="mt-8 border-t border-line pt-4 text-xs text-muted">
          <p>
            Tax figures are an estimate based on Australian resident rates, the
            Medicare levy and the low income tax offset. They ignore HELP debt,
            private health cover, other offsets and levy exemptions. Confirm all
            figures with your registered tax agent before lodging.
          </p>
        </footer>
      </div>
    </div>
  );
}
