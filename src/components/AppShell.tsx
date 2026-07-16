import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "./Sidebar";

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
    <div className="flex min-h-screen bg-surface">
      <Sidebar loggedIn={!!user} logoutAction={logout} />

      <div className="flex min-w-0 flex-1 flex-col px-4 py-5 sm:px-8 sm:py-7">
        {user && (
          <header className="flex items-center justify-end">
            <Link
              href="/profile"
              title="Edit profile"
              className="flex items-center gap-2.5 rounded-full p-1 pr-4 transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {name?.[0]?.toUpperCase()}
                </span>
              )}
              <span className="leading-tight">
                <span className="block max-w-[160px] truncate text-sm font-semibold text-ink">
                  {name}
                </span>
                <span className="block text-xs text-muted">Account holder</span>
              </span>
            </Link>
          </header>
        )}

        <main className={user ? "mt-6" : "mt-2"}>{children}</main>
      </div>
    </div>
  );
}
