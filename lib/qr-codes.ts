import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { QRCodeRecord } from "@/lib/types";

export const getActiveQRCode = cache(async (code: string): Promise<QRCodeRecord | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("qr_codes").select("*").eq("code", code).eq("active", true).maybeSingle();
  return data;
});

export function managedQRCodeUrl(code: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin) throw new Error("Missing required environment variable: NEXT_PUBLIC_SITE_URL");
  return `${origin.replace(/\/$/, "")}/q/${code}`;
}
