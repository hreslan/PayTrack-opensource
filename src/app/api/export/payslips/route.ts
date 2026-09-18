import { auth } from "@/lib/auth";
import { payslipsCsv } from "@/lib/csv";
import { availableYears, loadExport, parseScope, scopeFilenameSuffix } from "@/lib/export-data";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const years = await availableYears(session.user.id);
  const scope = parseScope(url.searchParams.get("fy") ?? undefined, years);
  const { payslips } = await loadExport(session.user.id, scope);

  const suffix = scopeFilenameSuffix(scope);
  return new Response(payslipsCsv(payslips), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payslips-${suffix}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
