import Link from "next/link";

export type Segment = { href: string; label: string; active: boolean };

export default function SegmentedTabs({ items }: { items: Segment[] }) {
  return (
    <nav className="inline-flex flex-wrap gap-0.5 rounded-control border border-line bg-inset p-0.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            item.active
              ? "bg-surface text-ink shadow-card"
              : "text-muted hover:text-ink"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
