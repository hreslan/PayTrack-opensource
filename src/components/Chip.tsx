type Tone = "neutral" | "accent" | "positive";

const toneClasses: Record<Tone, string> = {
  neutral: "border-line bg-inset text-ink-soft",
  accent: "border-accent/30 bg-accent-soft text-accent",
  positive: "border-positive/30 bg-positive-soft text-positive",
};

export default function Chip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-badge border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
