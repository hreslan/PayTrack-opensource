export default function Chip({
  children,
  caret = false,
  className = "",
}: {
  children: React.ReactNode;
  caret?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-card px-3 py-1.5 text-xs font-medium text-ink ${className}`}
    >
      {children}
      {caret && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d="M2 3.5 5 6.5 8 3.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}
