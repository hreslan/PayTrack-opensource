import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import AuthForm from "@/components/AuthForm";
import { registerAction } from "@/lib/auth-actions";

export default function RegisterPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-md py-10">
        <Card>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Create your account
          </h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            Your payslip data is tied to your account, not your device.
          </p>
          <AuthForm mode="register" action={registerAction} />
        </Card>
      </div>
    </AppShell>
  );
}
