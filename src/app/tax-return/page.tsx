import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { estimateTax, fyOf, fyLabel } from "@/lib/tax";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import StatCard from "@/components/StatCard";
import PillButton from "@/components/PillButton";

export default async function TaxReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [payslips, deductions] = await Promise.all([
    prisma.payslip.findMany({ where: { userId: session.user.id } }),
    prisma.deduction.findMany({ where: { userId: session.user.id } }),
  ]);

  // Which financial years have any data?
  const years = [
    ...new Set([
      ...payslips.map((p) => fyOf(p.periodEnd ?? p.periodStart ?? p.createdAt)),
      ...deductions.map((d) => fyOf(d.date ?? d.createdAt)),
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

  const gross = fySlips.reduce((acc, p) => acc + (p.grossPay ?? 0), 0);
  const withheld = fySlips.reduce((acc, p) => acc + (p.tax ?? 0), 0);
  const deducted = fyDeductions.reduce((acc, d) => acc + d.amount, 0);
  const taxable = Math.max(0, gross - deducted);
  const est = estimateTax(taxable);
  const outcome = withheld - est.netTax; // positive → refund, negative → owing
  const hasData = fySlips.length > 0 || fyDeductions.length > 0;

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Tax return estimate
          </h1>
          <p className="mt-1 text-sm text-muted">
            Worked out from your saved payslips and deductions for the{" "}
            {fyLabel(fy)} financial year.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {years.map((y) => (
            <Link
              key={y}
              href={y === years[0] ? "/tax-return" : `/tax-return?fy=${y}`}
              aria-current={y === fy ? "page" : undefined}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                y === fy
                  ? "border-ink bg-ink text-white"
                  : "border-ink/10 bg-card text-ink hover:border-ink/30"
              }`}
            >
              FY {fyLabel(y)}
            </Link>
          ))}
        </div>
      </div>

      {!hasData ? (
        <Card className="mt-8 flex flex-col items-center gap-4 py-14 text-center">
          <p className="max-w-sm text-sm text-muted">
            Nothing to estimate yet for {fyLabel(fy)}. Upload payslips and add
            deductions and the estimate appears here.
          </p>
          <PillButton href="/upload" arrow>
            Upload a payslip
          </PillButton>
        </Card>
      ) : (
        <>
          <Card className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs font-medium text-muted">
                {outcome >= 0
                  ? "Estimated refund"
                  : "Estimated tax you still owe"}
              </p>
              <p
                className={`mt-2 text-5xl font-bold tracking-tight ${
                  outcome >= 0 ? "text-accent" : "text-ink"
                }`}
              >
                {formatMoney(Math.abs(outcome))}
              </p>
              <p className="mt-2 max-w-md text-xs text-muted">
                Estimate only — based on resident tax rates, the Medicare levy
                and the low income tax offset. It ignores HELP debt, private
                health cover and anything else on your actual return.
              </p>
            </div>
            <div className="text-sm leading-7 text-muted">
              <p>
                Tax withheld on payslips{" "}
                <span className="font-semibold text-ink">{formatMoney(withheld)}</span>
              </p>
              <p>
                Estimated tax for the year{" "}
                <span className="font-semibold text-ink">{formatMoney(est.netTax)}</span>
              </p>
            </div>
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Income (gross pay)" value={formatMoney(gross)} />
            <StatCard label="Deductions claimed" value={formatMoney(deducted)} />
            <StatCard label="Taxable income" value={formatMoney(taxable)} />
            <StatCard
              label="Tax + Medicare levy"
              value={formatMoney(est.netTax)}
              ringPercent={taxable > 0 ? (est.netTax / taxable) * 100 : 0}
            />
          </div>

          <Card className="mt-6">
            <h2 className="text-lg font-bold tracking-tight text-ink">
              How it&apos;s worked out
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ["Gross income from payslips", formatMoney(gross)],
                ["Less deductions", `− ${formatMoney(deducted)}`],
                ["Taxable income", formatMoney(taxable)],
                ["Income tax on that", formatMoney(est.incomeTax)],
                ["Low income tax offset", `− ${formatMoney(est.lito)}`],
                ["Medicare levy", `+ ${formatMoney(est.medicare)}`],
                ["Estimated tax for the year", formatMoney(est.netTax)],
                ["Tax already withheld", formatMoney(withheld)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-ink/5 py-2 last:border-0">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-muted">
              {outcome >= 0 ? (
                <>
                  You&apos;ve had more withheld than the estimated tax, so around{" "}
                  <span className="font-semibold text-ink">
                    {formatMoney(outcome)}
                  </span>{" "}
                  would come back to you.
                </>
              ) : (
                <>
                  Less has been withheld than the estimated tax, so around{" "}
                  <span className="font-semibold text-ink">
                    {formatMoney(-outcome)}
                  </span>{" "}
                  would be payable.
                </>
              )}
            </p>
          </Card>
        </>
      )}
    </AppShell>
  );
}
