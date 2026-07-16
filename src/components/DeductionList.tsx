"use client";

import { useTransition } from "react";
import Chip from "./Chip";
import { deleteDeduction } from "@/lib/deduction-actions";

export type DeductionRow = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: string;
};

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

export default function DeductionList({ rows }: { rows: DeductionRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr className="border-b border-ink/5">
            <th className={headClasses}>Date</th>
            <th className={headClasses}>Item</th>
            <th className={headClasses}>Category</th>
            <th className={headClasses}>Amount</th>
            <th className={headClasses}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-ink/5 last:border-0">
              <td className={`${cellClasses} text-ink`}>{r.date}</td>
              <td className={`${cellClasses} font-semibold text-ink`}>{r.description}</td>
              <td className={cellClasses}>
                <Chip>{r.category}</Chip>
              </td>
              <td className={`${cellClasses} font-bold text-ink`}>{r.amount}</td>
              <td className={`${cellClasses} text-right`}>
                <DeleteButton id={r.id} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">
                No deductions yet. Scan a receipt or add one above — they lower
                your estimated tax.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
