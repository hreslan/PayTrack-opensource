import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import ProfileForm from "@/components/ProfileForm";
import TwoFactorCard from "@/components/TwoFactorCard";
import DeleteAccountCard from "@/components/DeleteAccountCard";

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
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Profile"
          description="Your account details, sign-in security and data controls."
        />
        <Card className="mt-6">
          <h2 className="mb-5 text-sm font-semibold text-ink">Account details</h2>
          <ProfileForm
            initialName={user.displayName ?? ""}
            initialAvatar={user.avatar}
            initialPhone={user.phone ?? ""}
            email={user.email}
          />
        </Card>
        <TwoFactorCard enabled={user.twoFactorEnabled} />
        <DeleteAccountCard />
      </div>
    </AppShell>
  );
}
