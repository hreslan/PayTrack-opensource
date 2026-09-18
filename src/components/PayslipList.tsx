"use client";

import { useState, useTransition } from "react";
import { deletePayslip } from "@/lib/payslip-actions";
import { iconButtonClasses, td, tdNumeric, tdStrong, rowClasses, inputClasses } from "./ui";
import { SortHeader, sortRows, useSort } from "./sorting";

type SortKey = "period" | "net" | "gross" | "tax" | "superann";

export type PayslipRow = {
  id: string;
  period: string;
  net: string;
  gross: string;
  tax: string;
  fuel: string;
  meal: string;
  superann: string;
  sort: Record<SortKey, number>;
};

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
      className={iconButtonClasses}
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

export default function PayslipList({ rows }: { rows: PayslipRow[] }) {
  const [query, setQuery] = useState("");
  const sort = useSort<SortKey>("period");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        [r.period, r.net, r.gross, r.tax, r.fuel, r.meal, r.superann]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : rows;
  const sorted = sortRows(filtered, sort, (row, key) => row.sort[key]);

  return (
    <div className="rounded-card border border-line bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <h2 className="text-sm font-semibold text-ink">
          Payslips{" "}
          <span className="ml-1 font-normal tabular-nums text-muted">
            {filtered.length}
          </span>
        </h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search payslips…"
          aria-label="Search payslips"
          className={`${inputClasses} w-full sm:w-56`}
        />
      </div>

      {/* Mobile: stacked cards so nothing is cut off on a narrow screen */}
      <div className="flex flex-col divide-y divide-line sm:hidden">
        {sorted.map((r) => (
          <div key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Pay period</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{r.period}</p>
              </div>
              <DeleteButton id={r.id} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                ["Net", r.net],
                ["Gross", r.gross],
                ["Tax", r.tax],
                ["Super", r.superann],
                ["Fuel", r.fuel],
                ["Meals", r.meal],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-2">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="text-sm tabular-nums text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="p-6 text-center text-sm text-muted">
            No payslips match your search.
          </p>
        )}
      </div>

      <div className="relative hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <SortHeader label="Pay period" sortKey="period" state={sort} />
              <SortHeader label="Net" sortKey="net" state={sort} numeric />
              <SortHeader label="Gross" sortKey="gross" state={sort} numeric />
              <SortHeader label="Tax" sortKey="tax" state={sort} numeric />
              <th className={`${td} text-right text-[11px] font-semibold uppercase tracking-wider text-muted`}>
                Fuel
              </th>
              <th className={`${td} text-right text-[11px] font-semibold uppercase tracking-wider text-muted`}>
                Meals
              </th>
              <SortHeader label="Super" sortKey="superann" state={sort} numeric />
              <th className={td}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className={rowClasses}>
                <td className={tdStrong}>{r.period}</td>
                <td className={`${tdNumeric} font-semibold`}>{r.net}</td>
                <td className={tdNumeric}>{r.gross}</td>
                <td className={tdNumeric}>{r.tax}</td>
                <td className={tdNumeric}>{r.fuel}</td>
                <td className={tdNumeric}>{r.meal}</td>
                <td className={tdNumeric}>{r.superann}</td>
                <td className={`${td} text-right`}>
                  <DeleteButton id={r.id} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-muted">
                  No payslips match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
