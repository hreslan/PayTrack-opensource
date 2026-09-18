import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmUpload, cancelUpload } from "@/lib/payslip-actions";
import type { AmountField, ExtractedFields } from "@/lib/parser";
import { centsToInput } from "@/lib/format";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import ConfirmForm, { type ConfirmField } from "@/components/ConfirmForm";

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const pending = await prisma.pendingUpload.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!pending) notFound();

  const extracted = JSON.parse(pending.extracted) as ExtractedFields;

  const money = (name: AmountField, title: string): ConfirmField => ({
    name,
    title,
    type: "money",
    value: centsToInput(extracted[name]),
    matchedLabel: extracted.labels[name] ?? null,
  });

  const fields: ConfirmField[] = [
    {
      name: "periodStart",
      title: "Pay period start",
      type: "date",
      value: extracted.periodStart ?? "",
      matchedLabel: extracted.periodStart ? (extracted.labels.period ?? null) : null,
    },
    {
      name: "periodEnd",
      title: "Pay period end",
      type: "date",
      value: extracted.periodEnd ?? "",
      matchedLabel: extracted.periodEnd ? (extracted.labels.period ?? null) : null,
    },
    money("grossPay", "Gross pay"),
    money("netPay", "Net pay"),
    money("tax", "Tax"),
    money("superannuation", "Superannuation"),
    money("fuelAllowance", "Fuel allowance"),
    money("mealAllowance", "Meal allowance"),
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Check the figures"
          description="These values were read from your PDF. Fix anything that looks wrong — blank fields are ones we could not find."
        />
        <Card className="mt-6">
          <ConfirmForm
            fields={fields}
            confirmAction={confirmUpload.bind(null, pending.id)}
            cancelAction={cancelUpload.bind(null, pending.id)}
          />
        </Card>
      </div>
    </AppShell>
  );
}
