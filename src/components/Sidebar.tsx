"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="2.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="10" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="10" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 11.5V3m0 0L5.5 6.5M9 3l3.5 3.5M3.5 15h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TaxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m6.5 11.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6.8" cy="6.8" r="0.9" fill="currentColor" />
      <circle cx="11.2" cy="11.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M4 2.5h10V15l-1.7-1.2L10.6 15 9 13.8 7.4 15l-1.7-1.2L4 15V2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M6.5 6h5M6.5 9h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 2.5v8m0-8L6.5 5M9 2.5 11.5 5M3.5 10v4A1.5 1.5 0 0 0 5 15.5h8a1.5 1.5 0 0 0 1.5-1.5v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 15c.8-2.6 3-4 5.5-4s4.7 1.4 5.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EnterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M7 5V3.5A1.5 1.5 0 0 1 8.5 2h5A1.5 1.5 0 0 1 15 3.5v11a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 7 14.5V13M2.5 9h8m0 0L8 6.5M10.5 9 8 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RegisterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 15c.7-2.4 2.7-3.8 5-3.8 1 0 2 .25 2.8.75M14 10.5v5M11.5 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-5A1.5 1.5 0 0 0 3 3.5v11A1.5 1.5 0 0 0 4.5 16h5a1.5 1.5 0 0 0 1.5-1.5V13M7.5 9h8m0 0L13 6.5M15.5 9 13 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const itemBase =
  "flex items-center gap-3 rounded-full p-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:px-5 md:py-3";

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={label}
      className={`${itemBase} ${
        active ? "bg-ink text-white" : "text-muted hover:bg-card hover:text-ink"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

export default function Sidebar({
  loggedIn,
  logoutAction,
}: {
  loggedIn: boolean;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  const links = loggedIn
    ? [
        { href: "/", label: "Dashboard", icon: <DashboardIcon /> },
        { href: "/upload", label: "Upload payslip", icon: <UploadIcon /> },
        { href: "/tax-return", label: "Tax return", icon: <TaxIcon /> },
        { href: "/deductions", label: "Deductions", icon: <ReceiptIcon /> },
        { href: "/export", label: "Export", icon: <ExportIcon /> },
        { href: "/profile", label: "Profile", icon: <ProfileIcon /> },
      ]
    : [
        { href: "/login", label: "Log in", icon: <EnterIcon /> },
        { href: "/register", label: "Register", icon: <RegisterIcon /> },
      ];

  return (
    <nav className="sticky top-0 flex h-screen w-[72px] shrink-0 flex-col border-r border-ink/5 px-3 py-5 md:w-60 md:px-5 md:py-7">
      <Link
        href="/"
        className="mb-8 flex items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink p-1.5">
          <Image
            src="/brand/paytrack-icon.png"
            alt="PayTrack"
            fill
            sizes="44px"
            className="object-contain"
            priority
          />
        </span>
        <span className="hidden leading-tight md:block">
          <span className="block text-base font-bold text-ink">Payslip</span>
          <span className="block text-base text-muted">Dashboard</span>
        </span>
      </Link>

      <div className="flex flex-col gap-1.5">
        {links.map((link) => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            active={pathname === link.href}
          />
        ))}
      </div>

      {loggedIn && (
        <form action={logoutAction} className="mt-auto">
          <button
            type="submit"
            title="Log out"
            className={`${itemBase} w-full text-muted hover:bg-card hover:text-ink`}
          >
            <LogoutIcon />
            <span className="hidden md:inline">Log out</span>
          </button>
        </form>
      )}
    </nav>
  );
}
