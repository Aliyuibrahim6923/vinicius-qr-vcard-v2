import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/types";

export const getActiveEmployee = cache(async (slug: string): Promise<Employee | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("employees").select("*").eq("slug", slug).eq("active", true).maybeSingle();
  return data;
});

export function canonicalUrl(slug: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin) throw new Error("Missing required environment variable: NEXT_PUBLIC_SITE_URL");
  return `${origin.replace(/\/$/, "")}/p/${slug}`;
}
