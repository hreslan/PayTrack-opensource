import { formatMoney } from "@/lib/format";
import type { MonthPoint } from "@/lib/fy-months";

/** Bars top out well below the plot ceiling so the peak's label has room. */
const PEAK_HEIGHT = 80;

export default function MonthlyBarChart({
  title,
  data,
  note,
}: {
  title: string;
  data: MonthPoint[];
  note?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const peakIndex = max > 0 ? data.findIndex((d) => d.value === max) : -1;

  return (
    <div className="rounded-card border border-line bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="text-sm font-semibold tabular-nums text-ink">
          {formatMoney(total)}
        </p>
      </div>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}

      {max === 0 ? (
        <p className="mt-6 border-t border-line pt-6 text-center text-sm text-muted">
          Nothing recorded for this year yet.
        </p>
      ) : (
        <div
          className="mt-5"
          role="img"
          aria-label={`${title}. ${data
            .filter((d) => d.value > 0)
            .map((d) => `${d.full}: ${formatMoney(d.value)}`)
            .join(", ")}.`}
        >
          <div className="relative h-40">
            {/* Recessive gridlines behind the marks. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 flex flex-col justify-between"
            >
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-line" />
              ))}
            </div>

            <div className="relative flex h-full items-end gap-0.5">
              {data.map((d, i) => {
                const pct = max > 0 ? (d.value / max) * PEAK_HEIGHT : 0;
                return (
                  <div
                    key={d.label}
                    className="group relative flex h-full flex-1 items-end justify-center"
                  >
                    {d.value > 0 && (
                      <div
                        className="w-[58%] max-w-9 rounded-t-[4px] bg-chart transition-opacity group-hover:opacity-80"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                    )}
                    {i === peakIndex && (
                      <span
                        className="pointer-events-none absolute inset-x-0 text-center text-[10px] font-semibold tabular-nums text-muted"
                        style={{ bottom: `${Math.max(pct, 2)}%` }}
                      >
                        {formatMoney(d.value)}
                      </span>
                    )}
                    {/* The tooltip trigger is the whole column, wider than the bar itself. */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-control border border-line bg-surface px-2 py-1 text-xs shadow-raised group-hover:block">
                      <span className="font-medium text-ink">{d.full}</span>
                      <span className="ml-2 font-semibold tabular-nums text-ink">
                        {formatMoney(d.value)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 flex gap-0.5 border-t border-line pt-2">
            {data.map((d) => (
              <span
                key={d.label}
                className="flex-1 text-center text-[10px] font-medium text-muted"
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
