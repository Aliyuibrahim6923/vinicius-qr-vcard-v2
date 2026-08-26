"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const headerStore = await headers();
  const source = (headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? "unknown").split(",")[0].trim();
  const service = createServiceClient();
  const { data: allowed, error: rateError } = await service.rpc("check_login_rate_limit", { source, was_successful: false });
  if (rateError) {
    console.error("[auth/rate-limit] Supabase RPC failed", JSON.stringify({
      name: rateError.name,
      code: rateError.code,
      message: rateError.message,
      details: rateError.details,
      hint: rateError.hint,
      value: String(rateError)
    }));
    redirect("/login?error=authentication-service");
  }
  if (!allowed) redirect("/login?error=too-many-attempts");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || data.user?.app_metadata.role !== "admin") {
    if (data.session) await supabase.auth.signOut();
    redirect("/login?error=invalid-credentials");
  }
  const { error: resetError } = await service.rpc("check_login_rate_limit", { source, was_successful: true });
  if (resetError) console.error("[auth/rate-limit] Unable to clear successful login attempts", JSON.stringify({ code: resetError.code, message: resetError.message, value: String(resetError) }));
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
