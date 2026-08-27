import { createClient } from "@/lib/supabase/server";

export async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.app_metadata.role === "admin";
}
