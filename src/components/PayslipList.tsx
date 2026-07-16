"use client";

import { useState, useTransition } from "react";
import Card from "./Card";
import { deletePayslip } from "@/lib/payslip-actions";

export type PayslipRow = {
  id: string;
  period: string;
  net: string;
  gross: string;
  tax: string;
  fuel: string;
  meal: string;
  superann: string;
};

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10 10 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label="Delete payslip"
      disabled={isPending}
      onClick={() => {
        if (window.confirm("Delete this payslip permanently? This cannot be undone.")) {
          startTransition(() => deletePayslip(id));
        }
      }}
      className="flex size-10 items-center justify-center rounded-full border border-ink/10 bg-card text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path
          d="M2.5 4h10M6 4V2.75h3V4m-5.5 0 .6 8.25h6.8L11.5 4M6.2 6.5v3.75M8.8 6.5v3.75"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

const cellClasses = "px-3 py-3.5 text-sm whitespace-nowrap";
const headClasses = "px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap";

export default function PayslipList({ rows }: { rows: PayslipRow[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        [r.period, r.net, r.gross, r.tax, r.fuel, r.meal, r.superann]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : rows;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight text-ink">Payslips</h2>
        <label className="flex items-center gap-2 rounded-full border border-ink/10 bg-card px-4 py-2 text-muted focus-within:ring-2 focus-within:ring-accent">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search payslips…"
            className="w-36 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none sm:w-48"
          />
        </label>
      </div>

      {/* Mobile: stacked cards so nothing is cut off on a narrow screen */}
      <div className="mt-4 flex flex-col gap-3 sm:hidden">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-2xl border border-ink/5 bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted">Pay period</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{r.period}</p>
              </div>
              <DeleteButton id={r.id} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                ["Net", r.net, true],
                ["Gross", r.gross, false],
                ["Tax", r.tax, false],
                ["Super", r.superann, false],
                ["Fuel", r.fuel, false],
                ["Meals", r.meal, false],
              ].map(([label, value, strong]) => (
                <div key={label as string} className="flex items-baseline justify-between gap-2">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className={`text-sm ${strong ? "font-bold" : ""} text-ink`}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">
            No payslips match your search.
          </p>
        )}
      </div>

      {/* Desktop: full table. `relative` keeps the sr-only cell's containing block
          inside this scroll box so it can't push the page width out. */}
      <div className="relative mt-4 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-ink/5">
              <th className={headClasses}>Pay period</th>
              <th className={headClasses}>Net</th>
              <th className={headClasses}>Gross</th>
              <th className={headClasses}>Tax</th>
              <th className={headClasses}>Fuel</th>
              <th className={headClasses}>Meals</th>
              <th className={headClasses}>Super</th>
              <th className={headClasses}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-ink/5 last:border-0">
                <td className={`${cellClasses} font-semibold text-ink`}>{r.period}</td>
                <td className={`${cellClasses} font-bold text-ink`}>{r.net}</td>
                <td className={`${cellClasses} text-ink`}>{r.gross}</td>
                <td className={`${cellClasses} text-ink`}>{r.tax}</td>
                <td className={`${cellClasses} text-ink`}>{r.fuel}</td>
                <td className={`${cellClasses} text-ink`}>{r.meal}</td>
                <td className={`${cellClasses} text-ink`}>{r.superann}</td>
                <td className={`${cellClasses} text-right`}>
                  <DeleteButton id={r.id} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted">
                  No payslips match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
