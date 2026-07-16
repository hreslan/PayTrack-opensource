import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import AuthForm from "@/components/AuthForm";
import { loginAction } from "@/lib/auth-actions";

export default function LoginPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-md py-10">
        <Card>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Welcome back
          </h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            Log in to see your payslips on any device.
          </p>
          <AuthForm mode="login" action={loginAction} />
        </Card>
      </div>
    </AppShell>
  );
}
