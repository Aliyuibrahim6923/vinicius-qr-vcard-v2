import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/types";
import { siteOrigin } from "@/lib/site-url";

export const getVisibleEmployee = cache(async (slug: string): Promise<Employee | null> => {
  const supabase = await createClient();
  // RLS exposes active employees publicly and all employees to administrators.
  const { data } = await supabase.from("employees").select("*").eq("slug", slug).maybeSingle();
  return data;
});

export function canonicalUrl(slug: string) {
  return `${siteOrigin()}/p/${slug}`;
}
