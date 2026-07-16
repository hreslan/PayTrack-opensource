import Card from "./Card";

function ProgressRing({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-accent-soft)" strokeWidth="8" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(clamped / 100) * c} ${c}`}
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="var(--color-ink)"
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

export default function StatCard({
  label,
  value,
  ringPercent,
}: {
  label: string;
  value: string;
  ringPercent?: number;
}) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-ink">
          {value.startsWith("$") ? (
            <>
              <span className="font-medium text-ink/60">$</span>
              {value.slice(1)}
            </>
          ) : (
            value
          )}
        </p>
      </div>
      {ringPercent !== undefined && <ProgressRing percent={ringPercent} />}
    </Card>
  );
}
