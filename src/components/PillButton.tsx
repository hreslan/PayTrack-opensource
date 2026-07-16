import Link from "next/link";

type Variant = "primary" | "secondary" | "tertiary" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent/90",
  secondary: "bg-ink text-white hover:bg-ink/85",
  tertiary: "bg-card text-ink border border-ink/10 hover:border-ink/30",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none";

type Props = {
  variant?: Variant;
  arrow?: boolean;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 8h11M9 3.5 13.5 8 9 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PillButton({
  variant = "primary",
  arrow = false,
  href,
  className = "",
  children,
  ...rest
}: Props) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
        {arrow && <Arrow />}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}
