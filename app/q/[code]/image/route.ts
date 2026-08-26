import QRCode from "qrcode";
import { getActiveQRCode, managedQRCodeUrl } from "@/lib/qr-codes";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const qrCode = await getActiveQRCode(code);
  if (!qrCode) return new Response("Not found", { status: 404 });
  const svg = await QRCode.toString(managedQRCodeUrl(code), { type: "svg", errorCorrectionLevel: "H", margin: 4, width: 1024, color: { dark: "#191a1b", light: "#ffffff" } });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Content-Disposition": `attachment; filename="${code}-qr.svg"`, "Cache-Control": "private, no-store" } });
}
