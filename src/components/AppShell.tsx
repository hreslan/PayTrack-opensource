import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar, { MobileMenu } from "./Sidebar";

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, displayName: true, avatar: true },
      })
    : null;

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const name = user ? user.displayName || user.email.split("@")[0] : null;

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar loggedIn={!!user} logoutAction={logout} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={`sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5 sm:px-6 ${
            user ? "" : "md:hidden"
          }`}
        >
          <MobileMenu loggedIn={!!user} logoutAction={logout} />
          {user ? (
            <ProfileLink avatar={user.avatar} name={name} email={user.email} />
          ) : (
            <Link
              href="/"
              className="ml-auto text-base font-semibold tracking-tight text-ink"
            >
              PayTrack
            </Link>
          )}
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function ProfileLink({
  avatar,
  name,
  email,
}: {
  avatar: string | null;
  name: string | null;
  email: string;
}) {
  return (
    <Link
      href="/profile"
      title="Edit profile"
      className="ml-auto flex items-center gap-2.5 rounded-control px-2 py-1.5 transition-colors hover:bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="hidden leading-tight sm:block">
        <span className="block max-w-[180px] truncate text-sm font-medium text-ink">
          {name}
        </span>
        <span className="block max-w-[180px] truncate text-xs text-muted">
          {email}
        </span>
      </span>
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="size-8 rounded-full object-cover" />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
          {name?.[0]?.toUpperCase()}
        </span>
      )}
    </Link>
  );
}
