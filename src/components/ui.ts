/** Shared class strings for the form and table primitives. */

export const inputClasses =
  "w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-ink transition-colors placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export const labelClasses = "text-xs font-medium text-ink-soft";

export const fieldClasses = "flex flex-col gap-1.5";

export const codeInputClasses =
  "w-full rounded-control border border-line bg-surface px-3 py-2.5 text-center text-lg font-semibold tracking-[0.4em] tabular-nums text-ink transition-colors placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export const errorClasses = "text-sm font-medium text-danger";

export const th =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted whitespace-nowrap";

export const thNumeric = `${th} text-right`;

export const td = "px-3 py-3 text-sm text-ink-soft whitespace-nowrap";

export const tdNumeric = `${td} text-right tabular-nums text-ink`;

export const tdStrong = `${td} font-medium text-ink`;

export const rowClasses = "border-t border-line transition-colors hover:bg-inset";

export const iconButtonClasses =
  "flex size-8 items-center justify-center rounded-control border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40";
