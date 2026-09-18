import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CHALLENGE_COOKIE, describeChannels } from "@/lib/otp";
import {
  verifyLoginAction,
  resendLoginCodeAction,
  cancelLoginAction,
} from "@/lib/auth-actions";
import AppShell from "@/components/AppShell";
import AuthCard from "@/components/AuthCard";
import VerifyForm from "@/components/VerifyForm";

export default async function VerifyPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHALLENGE_COOKIE)?.value;
  if (!token) redirect("/login");

  const record = await prisma.verificationCode.findUnique({
    where: { token },
    include: { user: { select: { email: true } } },
  });
  if (!record || record.purpose !== "login" || record.expiresAt < new Date()) {
    redirect("/login");
  }

  return (
    <AppShell>
      <AuthCard
        title="Two-step verification"
        description={`${describeChannels(record.channels, record.user.email)} It expires in 10 minutes.`}
      >
        <VerifyForm
          verifyAction={verifyLoginAction}
          resendAction={resendLoginCodeAction}
          cancelAction={cancelLoginAction}
        />
      </AuthCard>
    </AppShell>
  );
}
