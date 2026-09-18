"use client";

import { useState } from "react";
import { th, thNumeric } from "./ui";

export type SortDir = "asc" | "desc";

export type SortState<K extends string> = {
  key: K;
  dir: SortDir;
  toggle: (next: K) => void;
};

export function useSort<K extends string>(
  defaultKey: K,
  defaultDir: SortDir = "desc"
): SortState<K> {
  const [key, setKey] = useState<K>(defaultKey);
  const [dir, setDir] = useState<SortDir>(defaultDir);

  function toggle(next: K) {
    if (next === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setKey(next);
      setDir("desc");
    }
  }

  return { key, dir, toggle };
}

/** Sorts a copy of `rows` by the comparable value `valueOf` returns. */
export function sortRows<T, K extends string>(
  rows: T[],
  { key, dir }: SortState<K>,
  valueOf: (row: T, key: K) => number | string
): T[] {
  return [...rows].sort((a, b) => {
    const av = valueOf(a, key);
    const bv = valueOf(b, key);
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return dir === "asc" ? cmp : -cmp;
  });
}

function Caret({ dir, active }: { dir: SortDir; active: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      className={`transition-opacity ${
        active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
      } ${dir === "asc" ? "rotate-180" : ""}`}
    >
      <path
        d="M2.5 4 5 6.5 7.5 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SortHeader<K extends string>({
  label,
  sortKey,
  state,
  numeric = false,
}: {
  label: string;
  sortKey: K;
  state: SortState<K>;
  numeric?: boolean;
}) {
  const active = state.key === sortKey;
  return (
    <th
      className={numeric ? thNumeric : th}
      aria-sort={active ? (state.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => state.toggle(sortKey)}
        // `uppercase` is repeated here because preflight resets
        // `text-transform` on buttons, so the <th>'s casing isn't inherited.
        className={`group inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          active ? "text-ink" : ""
        }`}
      >
        <span>{label}</span>
        <Caret dir={state.dir} active={active} />
      </button>
    </th>
  );
}
