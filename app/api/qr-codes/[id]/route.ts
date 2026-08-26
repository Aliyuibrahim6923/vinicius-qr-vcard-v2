import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/request";
import { normalizeQRCode, qrCodeSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata.role !== "admin") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = qrCodeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid QR code", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  const { id } = await params;
  const { data, error } = await supabase.from("qr_codes").update(normalizeQRCode(parsed.data)).eq("id", id).select().single();
  return error ? Response.json({ error: "Unable to update QR code" }, { status: 500 }) : Response.json(data);
}
