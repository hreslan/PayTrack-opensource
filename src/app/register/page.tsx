import AppShell from "@/components/AppShell";
import AuthCard from "@/components/AuthCard";
import AuthForm from "@/components/AuthForm";
import { registerAction } from "@/lib/auth-actions";

export default function RegisterPage() {
  return (
    <AppShell>
      <AuthCard
        title="Create your account"
        description="Your payslip data is tied to your account, not your device."
      >
        <AuthForm mode="register" action={registerAction} />
      </AuthCard>
    </AppShell>
  );
}
