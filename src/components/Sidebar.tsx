"use client";

import { useEffect, useState } from "react";
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

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const itemBase =
  "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function NavItem({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`${itemBase} ${
        active ? "bg-ink text-white" : "text-muted hover:bg-card hover:text-ink"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function useNavLinks(loggedIn: boolean) {
  return loggedIn
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
}

/** Shared inner content used by both the desktop sidebar and the mobile drawer. */
function SidebarContent({
  loggedIn,
  logoutAction,
  onNavigate,
  onClose,
}: {
  loggedIn: boolean;
  logoutAction: () => Promise<void>;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const links = useNavLinks(loggedIn);

  return (
    <div className="flex h-full flex-col px-5 py-6 md:py-7">
      <div className="relative mb-8 flex items-center justify-center">
        <Link
          href="/"
          aria-label="PayTrack"
          onClick={onNavigate}
          className="flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Image
            src="/brand/paytrack-lockup.png"
            alt="PayTrack"
            width={1965}
            height={443}
            sizes="180px"
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        {onClose && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="absolute right-0 flex size-9 items-center justify-center rounded-full border border-ink/10 bg-card text-ink transition-colors hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {links.map((link) => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            active={pathname === link.href}
            onClick={onNavigate}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-1.5 pt-6">
        {loggedIn && (
          <form action={logoutAction}>
            <button
              type="submit"
              className={`${itemBase} w-full text-muted hover:bg-card hover:text-ink`}
            >
              <LogoutIcon />
              <span>Log out</span>
            </button>
          </form>
        )}
        <Link
          href="/privacy"
          aria-current={pathname === "/privacy" ? "page" : undefined}
          onClick={onNavigate}
          className="px-4 py-1 text-xs font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Privacy &amp; your data
        </Link>
      </div>
    </div>
  );
}

/** Desktop sidebar — always visible on md+ screens, hidden on mobile. */
export default function Sidebar({
  loggedIn,
  logoutAction,
}: {
  loggedIn: boolean;
  logoutAction: () => Promise<void>;
}) {
  return (
    <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/5 md:flex">
      <SidebarContent loggedIn={loggedIn} logoutAction={logoutAction} />
    </nav>
  );
}

/** Mobile-only hamburger + slide-in drawer. Renders nothing on md+ screens. */
export function MobileMenu({
  loggedIn,
  logoutAction,
}: {
  loggedIn: boolean;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex size-11 items-center justify-center rounded-full border border-ink/10 bg-card text-ink transition-colors hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <MenuIcon />
      </button>

      <div
        className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={close}
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute left-0 top-0 h-full w-72 max-w-[82%] border-r border-ink/5 bg-surface shadow-xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent
            loggedIn={loggedIn}
            logoutAction={logoutAction}
            onNavigate={close}
            onClose={close}
          />
        </div>
      </div>
    </div>
  );
}
