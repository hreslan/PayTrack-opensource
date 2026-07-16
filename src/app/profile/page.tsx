import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import ProfileForm from "@/components/ProfileForm";
import TwoFactorCard from "@/components/TwoFactorCard";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      displayName: true,
      avatar: true,
      phone: true,
      twoFactorEnabled: true,
    },
  });
  if (!user) redirect("/login");

  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-6">
        <Card>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Profile</h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            Your name and photo, shown at the top of your dashboard.
          </p>
          <ProfileForm
            initialName={user.displayName ?? ""}
            initialAvatar={user.avatar}
            initialPhone={user.phone ?? ""}
            email={user.email}
          />
        </Card>
        <TwoFactorCard enabled={user.twoFactorEnabled} />
      </div>
    </AppShell>
  );
}
