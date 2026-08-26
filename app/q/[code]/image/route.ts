import QRCode from "qrcode";
import { managedQRCodeUrl } from "@/lib/qr-codes";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  // RLS exposes active codes publicly and disabled codes only to administrators.
  const { data: qrCode } = await supabase.from("qr_codes").select("code").eq("code", code).maybeSingle();
  if (!qrCode) return new Response("Not found", { status: 404 });
  const svg = await QRCode.toString(managedQRCodeUrl(code), { type: "svg", errorCorrectionLevel: "H", margin: 4, width: 1024, color: { dark: "#191a1b", light: "#ffffff" } });
  const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Content-Disposition": `${disposition}; filename="${code}-qr.svg"`, "Cache-Control": "private, no-store" } });
}
