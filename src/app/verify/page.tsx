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
import Card from "@/components/Card";
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
      <div className="mx-auto max-w-md py-10">
        <Card>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Two-step verification
          </h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            {describeChannels(record.channels, record.user.email)} It expires in
            10 minutes.
          </p>
          <VerifyForm
            verifyAction={verifyLoginAction}
            resendAction={resendLoginCodeAction}
            cancelAction={cancelLoginAction}
          />
        </Card>
      </div>
    </AppShell>
  );
}
