import { getVisibleEmployee } from "@/lib/employees";
import { buildVCard } from "@/lib/vcard";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const employee = await getVisibleEmployee(slug);
  if (!employee) return new Response("Not found", { status: 404 });
  
  const filename = `${employee.first_name}-${employee.last_name}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  
  const userAgent = request.headers.get("user-agent") || "";
  const isAndroid = /android/i.test(userAgent);
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  
  const url = new URL(request.url);
  const isFallback = url.searchParams.get("fallback") === "true";

  if (isAndroid && !isFallback) {
    const fallbackUrl = new URL(request.url);
    fallbackUrl.searchParams.set("fallback", "true");
    
    const intentParts = [
      "intent:#Intent",
      "action=android.intent.action.INSERT",
      "type=vnd.android.cursor.dir/contact"
    ];
    
    const name = `${employee.first_name} ${employee.last_name}`;
    intentParts.push(`S.name=${encodeURIComponent(name)}`);
    intentParts.push(`S.company=${encodeURIComponent("Vinicius Group")}`);
    
    if (employee.job_title) {
      intentParts.push(`S.job_title=${encodeURIComponent(employee.job_title)}`);
    }
    if (employee.phone) {
      intentParts.push(`S.phone=${encodeURIComponent(employee.phone)}`);
    }
    if (employee.email) {
      intentParts.push(`S.email=${encodeURIComponent(employee.email)}`);
    }
    if (employee.bio) {
      intentParts.push(`S.notes=${encodeURIComponent(employee.bio)}`);
    }
    if (employee.address) {
      intentParts.push(`S.postal=${encodeURIComponent(employee.address)}`);
    }
    
    intentParts.push(`S.browser_fallback_url=${encodeURIComponent(fallbackUrl.toString())}`);
    intentParts.push("end");
    
    const intentUrl = intentParts.join(";");
    const escapedFallback = fallbackUrl.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;");

    // Return an HTML trampoline that triggers the intent client-side.
    // Android Chrome blocks intent:// from server redirects but allows it from JS navigation.
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Saving contact…</title></head><body><p style="text-align:center;margin-top:40vh;font-family:sans-serif">Opening contacts…</p><script>window.location.href=${JSON.stringify(intentUrl)};setTimeout(function(){window.location.href=${JSON.stringify(fallbackUrl.toString())}},2000);</script><noscript><meta http-equiv="refresh" content="0;url=${escapedFallback}"></noscript></body></html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
    });
  }

  const disposition = isIos ? `inline; filename="${filename}.vcf"` : `attachment; filename="${filename}.vcf"`;

  return new Response(buildVCard(employee), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": disposition,
      "Cache-Control": "public, max-age=60, s-maxage=300"
    }
  });
}
