import AppShell from "@/components/AppShell";
import AuthCard from "@/components/AuthCard";
import AuthForm from "@/components/AuthForm";
import { loginAction } from "@/lib/auth-actions";

export default function LoginPage() {
  return (
    <AppShell>
      <AuthCard
        title="Welcome back"
        description="Log in to see your payslips on any device."
      >
        <AuthForm mode="login" action={loginAction} />
      </AuthCard>
    </AppShell>
  );
}
