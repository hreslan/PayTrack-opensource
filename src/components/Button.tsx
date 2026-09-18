import Link from "next/link";

type Variant = "primary" | "secondary" | "tertiary" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-inset text-ink border border-line hover:border-line-strong",
  tertiary: "bg-surface text-ink border border-line hover:border-line-strong",
  danger: "bg-danger text-white hover:opacity-90",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none";

/** For plain <a> elements that must do a real navigation (file downloads). */
export function buttonClasses(variant: Variant = "primary") {
  return `${baseClasses} ${variantClasses[variant]}`;
}

type Props = {
  variant?: Variant;
  arrow?: boolean;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

export default function Button({
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
