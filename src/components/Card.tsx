export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-line bg-card p-5 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
