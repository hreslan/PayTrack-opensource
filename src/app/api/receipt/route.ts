import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf-text";
import { auth } from "@/lib/auth";
import { parseReceipt } from "@/lib/receipt-parser";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// Reads a receipt PDF entirely in memory: the file is never written to disk
// or stored anywhere — only the extracted date/total/item go back to the form.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a receipt to upload." }, { status: 400 });
  }
  if (
    !file.name.toLowerCase().endsWith(".pdf") ||
    (file.type && file.type !== "application/pdf")
  ) {
    return NextResponse.json(
      {
        error:
          "Only PDF receipts can be read automatically. For photos, type the details in below instead.",
      },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File is too large — the maximum is 10 MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.subarray(0, 5).toString("latin1").startsWith("%PDF-")) {
    return NextResponse.json({ error: "That file is not a valid PDF." }, { status: 400 });
  }

  let text: string;
  try {
    text = await extractPdfText(buffer);
  } catch {
    return NextResponse.json(
      { error: "Could not read that PDF. Type the details in below instead." },
      { status: 400 }
    );
  }

  return NextResponse.json(parseReceipt(text));
}
