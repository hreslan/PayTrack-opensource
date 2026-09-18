import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import UploadForm from "@/components/UploadForm";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Upload a payslip"
          description="We read the figures, you check them, then the PDF is deleted for good. Only the confirmed numbers are kept."
        />
        <Card className="mt-6">
          <UploadForm />
        </Card>
      </div>
    </AppShell>
  );
}
