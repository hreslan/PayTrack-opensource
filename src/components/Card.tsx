export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card bg-card p-6 shadow-[0_1px_3px_rgba(23,23,26,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}
