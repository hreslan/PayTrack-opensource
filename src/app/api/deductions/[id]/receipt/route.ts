import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deduction = await prisma.deduction.findFirst({
    where: { id, userId: session.user.id },
    select: { receiptPath: true, receiptFileName: true },
  });
  if (!deduction?.receiptPath) {
    return NextResponse.json({ error: "No receipt saved for this deduction." }, { status: 404 });
  }

  let data: Buffer;
  try {
    data = await fs.readFile(deduction.receiptPath);
  } catch {
    return NextResponse.json({ error: "The receipt file could not be found." }, { status: 404 });
  }

  const filename = (deduction.receiptFileName || "receipt.pdf").replace(/[\r\n"]/g, "");
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(data.length),
    },
  });
}
