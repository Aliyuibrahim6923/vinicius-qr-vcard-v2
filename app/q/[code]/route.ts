import { createClient } from "@/lib/supabase/server";
import { getActiveQRCode } from "@/lib/qr-codes";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const qrCode = await getActiveQRCode(code);
  if (!qrCode) return new Response("QR code unavailable", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (qrCode.destination_type === "external" && qrCode.destination_url) {
    return Response.redirect(qrCode.destination_url, 307);
  }
  const supabase = await createClient();
  const { data: employee } = await supabase.from("employees").select("slug").eq("id", qrCode.employee_id).eq("active", true).maybeSingle();
  if (!employee) return new Response("Destination unavailable", { status: 404, headers: { "Cache-Control": "no-store" } });
  const suffix = qrCode.destination_type === "employee_vcard" ? "/vcard" : "";
  return Response.redirect(new URL(`/p/${employee.slug}${suffix}`, request.url), 307);
}
