import { auth } from "@/lib/auth";
import { deductionsCsv } from "@/lib/csv";
import { availableYears, loadExport, parseScope } from "@/lib/export-data";
import { fyLabel } from "@/lib/tax";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const years = await availableYears(session.user.id);
  const scope = parseScope(url.searchParams.get("fy") ?? undefined, years);
  const { deductions } = await loadExport(session.user.id, scope);

  const suffix = scope === "all" ? "all-years" : `FY${fyLabel(scope)}`;
  return new Response(deductionsCsv(deductions), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="deductions-${suffix}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
