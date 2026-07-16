import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { extractPdfText } from "@/lib/pdf-text";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePayslip } from "@/lib/parser";
import { UPLOAD_DIR, cleanupExpiredUploads } from "@/lib/uploads";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await cleanupExpiredUploads();

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a PDF file to upload." }, { status: 400 });
  }
  if (
    !file.name.toLowerCase().endsWith(".pdf") ||
    (file.type && file.type !== "application/pdf")
  ) {
    return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File is too large — the maximum is 10 MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.subarray(0, 5).toString("latin1").startsWith("%PDF-")) {
    return NextResponse.json(
      { error: "That file is not a valid PDF." },
      { status: 400 }
    );
  }

  let text: string;
  try {
    text = await extractPdfText(buffer);
  } catch {
    return NextResponse.json(
      { error: "Could not read that PDF. Is it a valid payslip file?" },
      { status: 400 }
    );
  }

  const extracted = parsePayslip(text);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, `${randomUUID()}.pdf`);
  await fs.writeFile(filePath, buffer);

  const pending = await prisma.pendingUpload.create({
    data: {
      userId: session.user.id,
      filePath,
      extracted: JSON.stringify(extracted),
    },
  });

  return NextResponse.json({ id: pending.id });
}
