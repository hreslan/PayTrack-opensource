"use client";

import { useTransition } from "react";
import Chip from "./Chip";
import { deleteDeduction } from "@/lib/deduction-actions";
import { iconButtonClasses, td, tdNumeric, tdStrong, rowClasses, th } from "./ui";
import { SortHeader, sortRows, useSort } from "./sorting";

type SortKey = "date" | "description" | "category" | "amount";

export type DeductionRow = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: string;
  hasReceipt: boolean;
  sort: { date: number; description: string; category: string; amount: number };
};

function DownloadReceiptButton({ id }: { id: string }) {
  return (
    <a
      href={`/api/deductions/${id}/receipt`}
      aria-label="Download receipt"
      title="Download receipt"
      className={iconButtonClasses}
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path
          d="M7.5 2v7m0 0L4.5 6M7.5 9 10.5 6M3 11.5v1A1.5 1.5 0 0 0 4.5 14h6a1.5 1.5 0 0 0 1.5-1.5v-1"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label="Delete deduction"
      disabled={isPending}
      onClick={() => {
        if (window.confirm("Delete this deduction permanently?")) {
          startTransition(() => deleteDeduction(id));
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

const emptyNote =
  "No deductions yet. Scan a receipt or add one above — they lower your estimated tax.";

export default function DeductionList({ rows }: { rows: DeductionRow[] }) {
  const sort = useSort<SortKey>("date");
  const sorted = sortRows(rows, sort, (row, key) => row.sort[key]);

  return (
    <>
      {/* Mobile: stacked cards so nothing is cut off on a narrow screen */}
      <div className="flex flex-col divide-y divide-line sm:hidden">
        {sorted.map((r) => (
          <div key={r.id} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{r.description}</p>
                <p className="mt-0.5 text-xs text-muted">{r.date}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {r.hasReceipt && <DownloadReceiptButton id={r.id} />}
                <DeleteButton id={r.id} />
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <Chip>{r.category}</Chip>
              <span className="text-sm font-semibold tabular-nums text-ink">
                {r.amount}
              </span>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">{emptyNote}</p>
        )}
      </div>

      <div className="relative -mx-1 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <SortHeader label="Date" sortKey="date" state={sort} />
              <SortHeader label="Item" sortKey="description" state={sort} />
              <SortHeader label="Category" sortKey="category" state={sort} />
              <SortHeader label="Amount" sortKey="amount" state={sort} numeric />
              <th className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className={rowClasses}>
                <td className={td}>{r.date}</td>
                <td className={tdStrong}>{r.description}</td>
                <td className={td}>
                  <Chip>{r.category}</Chip>
                </td>
                <td className={`${tdNumeric} font-semibold`}>{r.amount}</td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {r.hasReceipt && <DownloadReceiptButton id={r.id} />}
                    <DeleteButton id={r.id} />
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted">
                  {emptyNote}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
