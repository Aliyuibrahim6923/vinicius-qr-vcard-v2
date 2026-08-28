import { getVisibleEmployee } from "@/lib/employees";
import { buildVCard } from "@/lib/vcard";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const employee = await getVisibleEmployee(slug);
  if (!employee) return new Response("Not found", { status: 404 });

  const filename = `${employee.first_name}-${employee.last_name}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

  const userAgent = request.headers.get("user-agent") || "";
  const isIos = /iphone|ipad|ipod/i.test(userAgent);

  // iOS: inline so Safari shows the native "Add to Contacts" sheet.
  // Everything else (Android fetch from client, desktop): attachment download.
  const disposition = isIos ? `inline; filename="${filename}.vcf"` : `attachment; filename="${filename}.vcf"`;

  return new Response(buildVCard(employee), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": disposition,
      "Cache-Control": "public, max-age=60, s-maxage=300"
    }
  });
}
