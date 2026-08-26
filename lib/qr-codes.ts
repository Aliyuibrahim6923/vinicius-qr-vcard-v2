import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { QRCodeRecord } from "@/lib/types";
import { siteOrigin } from "@/lib/site-url";

export const getActiveQRCode = cache(async (code: string): Promise<QRCodeRecord | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("qr_codes").select("*").eq("code", code).eq("active", true).maybeSingle();
  return data;
});

export function managedQRCodeUrl(code: string) {
  return `${siteOrigin()}/q/${code}`;
}
