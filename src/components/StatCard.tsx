type Tone = "neutral" | "positive" | "negative";

const toneClasses: Record<Tone, string> = {
  neutral: "text-ink",
  positive: "text-positive",
  negative: "text-negative",
};

export default function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
  meterPercent,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  meterPercent?: number;
}) {
  return (
    <div className="flex flex-col rounded-card border border-line bg-card p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${toneClasses[tone]}`}
      >
        {value}
      </p>
      {sub && <p className="mt-2 text-xs text-muted">{sub}</p>}
      {meterPercent !== undefined && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-inset">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.max(0, Math.min(100, meterPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}
