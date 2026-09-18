import Image from "next/image";
import Card from "./Card";

export default function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <div className="mb-6 flex items-center justify-center gap-2">
        <Image
          src="/brand/paytrack-icon.png"
          alt=""
          width={128}
          height={128}
          sizes="28px"
          priority
          className="size-7 object-contain"
        />
        <span className="text-base font-semibold tracking-tight text-ink">
          PayTrack
        </span>
      </div>
      <Card>
        <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted">{description}</p>
        {children}
      </Card>
    </div>
  );
}
