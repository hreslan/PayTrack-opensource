import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma";

// Temp storage for uploaded PDFs, outside public/. Files here live at most
// 1 hour: they are removed on confirm, cancel, or expiry cleanup.
export const UPLOAD_DIR = path.join(process.cwd(), ".uploads");

// Permanent storage for receipts the user chose to keep, outside public/.
// Files here live until the owning Deduction is deleted.
export const RECEIPT_DIR = path.join(process.cwd(), ".receipts");

export async function removeFileQuietly(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {
    // already gone — nothing to do
  }
}

/** Deletes both the PDF on disk and the PendingUpload row. */
export async function deletePendingUpload(pending: {
  id: string;
  filePath: string;
}) {
  await removeFileQuietly(pending.filePath);
  try {
    await prisma.pendingUpload.delete({ where: { id: pending.id } });
  } catch {
    // row already deleted concurrently
  }
}

/** Purges every pending upload (file + row) older than 1 hour. */
export async function cleanupExpiredUploads() {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const expired = await prisma.pendingUpload.findMany({
    where: { createdAt: { lt: cutoff } },
  });
  for (const pending of expired) {
    await deletePendingUpload(pending);
  }
}
