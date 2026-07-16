import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import UploadForm from "@/components/UploadForm";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-6">
        <Card>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Upload a payslip
          </h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            We read the figures, you check them, then the PDF is deleted for
            good. Only the confirmed numbers are kept.
          </p>
          <UploadForm />
        </Card>
      </div>
    </AppShell>
  );
}
