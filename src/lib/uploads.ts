import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prisma } from "./prisma";

// Temp storage for uploaded PDFs, in the OS temp dir so it works on serverless
// hosts (e.g. Vercel, where only /tmp is writable). Files here live at most
// 1 hour: they are removed on confirm, cancel, or expiry cleanup. The confirm
// step reads the extracted fields from the DB, not the file, so it is safe if a
// temp file does not survive between serverless invocations.
export const UPLOAD_DIR = path.join(os.tmpdir(), "paytrack-uploads");

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
