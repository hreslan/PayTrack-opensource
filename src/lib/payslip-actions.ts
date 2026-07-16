"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { deletePendingUpload } from "./uploads";
import { parseMoneyInput } from "./format";

export type ConfirmFormState = { error: string } | undefined;

const MONEY_FIELDS = [
  "netPay",
  "grossPay",
  "tax",
  "fuelAllowance",
  "mealAllowance",
  "superannuation",
] as const;

const FIELD_TITLES: Record<(typeof MONEY_FIELDS)[number], string> = {
  netPay: "Net pay",
  grossPay: "Gross pay",
  tax: "Tax",
  fuelAllowance: "Fuel allowance",
  mealAllowance: "Meal allowance",
  superannuation: "Superannuation",
};

function parseDateInput(raw: FormDataEntryValue | null): Date | null | undefined {
  const value = String(raw ?? "").trim();
  if (value === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function confirmUpload(
  id: string,
  _prev: ConfirmFormState,
  formData: FormData
): Promise<ConfirmFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const pending = await prisma.pendingUpload.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!pending) redirect("/");

  const money: Partial<Record<(typeof MONEY_FIELDS)[number], number | null>> = {};
  for (const field of MONEY_FIELDS) {
    const parsed = parseMoneyInput(String(formData.get(field) ?? ""));
    if (parsed === undefined) {
      return { error: `“${FIELD_TITLES[field]}” is not a valid amount.` };
    }
    money[field] = parsed;
  }

  const periodStart = parseDateInput(formData.get("periodStart"));
  const periodEnd = parseDateInput(formData.get("periodEnd"));
  if (periodStart === undefined || periodEnd === undefined) {
    return { error: "Pay period dates must be valid dates." };
  }

  await prisma.payslip.create({
    data: {
      userId: session.user.id,
      periodStart,
      periodEnd,
      netPay: money.netPay,
      grossPay: money.grossPay,
      tax: money.tax,
      fuelAllowance: money.fuelAllowance,
      mealAllowance: money.mealAllowance,
      superannuation: money.superannuation,
    },
  });

  // The PDF is deleted from disk the moment the data is confirmed.
  await deletePendingUpload(pending);

  revalidatePath("/");
  redirect("/");
}

export async function cancelUpload(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const pending = await prisma.pendingUpload.findFirst({
    where: { id, userId: session.user.id },
  });
  if (pending) {
    await deletePendingUpload(pending);
  }
  redirect("/");
}

export async function deletePayslip(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.payslip.deleteMany({
    where: { id, userId: session.user.id },
  });
  revalidatePath("/");
}
