import { getActiveEmployee } from "@/lib/employees";
import { buildVCard } from "@/lib/vcard";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const employee = await getActiveEmployee(slug);
  if (!employee) return new Response("Not found", { status: 404 });
  const filename = `${employee.first_name}-${employee.last_name}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return new Response(buildVCard(employee), { headers: { "Content-Type": "text/vcard; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.vcf"`, "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
