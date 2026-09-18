"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { parseMoneyInput } from "./format";
import { DEDUCTION_CATEGORIES } from "./deduction-categories";
import { RECEIPT_DIR, removeFileQuietly } from "./uploads";

export type DeductionFormState = { error?: string; saved?: boolean } | undefined;

const MAX_RECEIPT_SIZE = 10 * 1024 * 1024; // 10 MB

/** Saves the receipt to disk if the user opted in and it's a valid PDF. Returns null if not kept. */
async function saveReceiptIfRequested(
  formData: FormData
): Promise<{ receiptPath: string; receiptFileName: string } | null | { error: string }> {
  if (formData.get("keepReceipt") !== "1") return null;

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) return null;

  if (file.size > MAX_RECEIPT_SIZE) {
    return { error: "Receipt is too large to keep — the maximum is 10 MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.subarray(0, 5).toString("latin1").startsWith("%PDF-")) {
    return { error: "That receipt file is not a valid PDF." };
  }

  await fs.mkdir(RECEIPT_DIR, { recursive: true });
  const receiptPath = path.join(RECEIPT_DIR, `${randomUUID()}.pdf`);
  await fs.writeFile(receiptPath, buffer);

  return { receiptPath, receiptFileName: file.name.slice(0, 120) };
}

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

  const receipt = await saveReceiptIfRequested(formData);
  if (receipt && "error" in receipt) return { error: receipt.error };

  await prisma.deduction.create({
    data: {
      userId: session.user.id,
      description,
      category,
      amount,
      date,
      receiptPath: receipt?.receiptPath ?? null,
      receiptFileName: receipt?.receiptFileName ?? null,
    },
  });

  revalidatePath("/deductions");
  revalidatePath("/tax-return");
  return { saved: true };
}

export async function deleteDeduction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const deduction = await prisma.deduction.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!deduction) return;

  await prisma.deduction.delete({ where: { id: deduction.id } });
  if (deduction.receiptPath) await removeFileQuietly(deduction.receiptPath);

  revalidatePath("/deductions");
  revalidatePath("/tax-return");
}
