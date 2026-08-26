import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/request";
import { normalizeQRCode, qrCodeSchema } from "@/lib/validation";

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.app_metadata.role === "admin" ? supabase : null;
}

export async function GET() {
  const supabase = await getAdminClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("qr_codes").select("*").order("name");
  return error ? Response.json({ error: "Unable to load QR codes" }, { status: 500 }) : Response.json(data);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const supabase = await getAdminClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = qrCodeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid QR code", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = randomBytes(9).toString("base64url");
    const { data, error } = await supabase.from("qr_codes").insert({ ...normalizeQRCode(parsed.data), code }).select().single();
    if (!error) return Response.json(data, { status: 201 });
    if (error.code !== "23505") return Response.json({ error: "Unable to create QR code" }, { status: 500 });
  }
  return Response.json({ error: "Unable to allocate a unique QR code" }, { status: 503 });
}
