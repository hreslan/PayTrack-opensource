"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { parseMoneyInput } from "./format";
import { DEDUCTION_CATEGORIES } from "./deduction-categories";

export type DeductionFormState = { error?: string; saved?: boolean } | undefined;

export async function addDeduction(
  _prev: DeductionFormState,
  formData: FormData
): Promise<DeductionFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const description = String(formData.get("description") ?? "").trim();
  if (description.length < 2 || description.length > 120) {
    return { error: "Describe the item in 2–120 characters." };
  }

  const category = String(formData.get("category") ?? "");
  if (!(DEDUCTION_CATEGORIES as readonly string[]).includes(category)) {
    return { error: "Pick a category." };
  }

  const amount = parseMoneyInput(String(formData.get("amount") ?? ""));
  if (amount === null || amount === undefined || amount <= 0) {
    return { error: "Enter the amount, e.g. 45.00." };
  }

  const dateRaw = String(formData.get("date") ?? "").trim();
  let date: Date | null = null;
  if (dateRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
      return { error: "The date doesn't look right." };
    }
    date = new Date(`${dateRaw}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return { error: "The date doesn't look right." };
  }

  await prisma.deduction.create({
    data: {
      userId: session.user.id,
      description,
      category,
      amount,
      date,
    },
  });

  revalidatePath("/deductions");
  revalidatePath("/tax-return");
  return { saved: true };
}

export async function deleteDeduction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.deduction.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/deductions");
  revalidatePath("/tax-return");
}
