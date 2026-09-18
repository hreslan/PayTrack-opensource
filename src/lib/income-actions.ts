"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { parseMoneyInput } from "./format";
import { INCOME_CATEGORIES } from "./income-categories";

export type IncomeFormState = { error?: string; saved?: boolean } | undefined;

export async function addOtherIncome(
  _prev: IncomeFormState,
  formData: FormData
): Promise<IncomeFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const description = String(formData.get("description") ?? "").trim();
  if (description.length < 2 || description.length > 120) {
    return { error: "Describe the income in 2–120 characters." };
  }

  const category = String(formData.get("category") ?? "");
  if (!(INCOME_CATEGORIES as readonly string[]).includes(category)) {
    return { error: "Pick a category." };
  }

  const amount = parseMoneyInput(String(formData.get("amount") ?? ""));
  if (amount === null || amount === undefined || amount <= 0) {
    return { error: "Enter the amount, e.g. 145.00." };
  }

  const taxRaw = String(formData.get("tax") ?? "").trim();
  let tax: number | null = null;
  if (taxRaw) {
    const parsed = parseMoneyInput(taxRaw);
    if (parsed === undefined || parsed === null || parsed < 0) {
      return { error: "Enter the tax withheld, e.g. 25.00." };
    }
    tax = parsed;
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

  await prisma.otherIncome.create({
    data: { userId: session.user.id, description, category, amount, tax, date },
  });

  revalidatePath("/");
  revalidatePath("/income");
  revalidatePath("/tax-return");
  return { saved: true };
}

export async function deleteOtherIncome(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const income = await prisma.otherIncome.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!income) return;

  await prisma.otherIncome.delete({ where: { id: income.id } });

  revalidatePath("/");
  revalidatePath("/income");
  revalidatePath("/tax-return");
}
