import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { AdminDirectory } from "./admin-directory";
import { QRCodeManager } from "./qr-code-manager";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/app/components/brand-logo";
import { BotSetup } from "./bot-setup";
import type { BotSettings } from "@/lib/types";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata.role !== "admin") redirect("/login");
  const [{ data: employees }, { data: qrCodes }, { data: botSettings }, { data: sources }] = await Promise.all([
    supabase.from("employees").select("*").order("last_name"),
    supabase.from("qr_codes").select("*").order("name"),
    supabase.from("bot_settings").select("*").eq("id", true).single(),
    supabase.from("bot_knowledge_sources").select("*").order("created_at", { ascending: false }),
  ]);
  const defaults: BotSettings = { id: true, enabled: false, company_name: "Vinicius Group", whatsapp_number: "", greeting_message: "Hello, I would like to learn more about Vinicius Group.", system_prompt: "You are the Vinicius Group assistant. Answer clearly and professionally using only the approved company knowledge provided. If the answer is not in the knowledge, say you do not have that information and suggest contacting the company.", updated_at: new Date(0).toISOString() };
  return <main className="admin-shell"><header className="admin-header"><div className="admin-brand"><BrandLogo className="brand-logo-admin" priority /><div><span className="eyebrow">Vinicius Group</span><h1>QR management</h1></div></div><form action={signOut}><button className="button secondary">Sign out {user?.email}</button></form></header><BotSetup initialSettings={(botSettings as BotSettings | null) ?? defaults} initialSources={sources ?? []} /><QRCodeManager initialQRCodes={qrCodes ?? []} employees={employees ?? []} /><section className="admin-section"><div className="section-heading"><div><span className="eyebrow">vCards</span><h2>Employees</h2></div></div><AdminDirectory initialEmployees={employees ?? []} /></section></main>;
}
