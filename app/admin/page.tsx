import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { AdminDirectory } from "./admin-directory";
import { QRCodeManager } from "./qr-code-manager";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/app/components/brand-logo";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata.role !== "admin") redirect("/login");
  const [{ data: employees }, { data: qrCodes }] = await Promise.all([
    supabase.from("employees").select("*").order("last_name"),
    supabase.from("qr_codes").select("*").order("name")
  ]);
  return <main className="admin-shell"><header className="admin-header"><div className="admin-brand"><BrandLogo className="brand-logo-admin" priority /><div><span className="eyebrow">Vinicius Group</span><h1>QR management</h1></div></div><form action={signOut}><button className="button secondary">Sign out {user?.email}</button></form></header><QRCodeManager initialQRCodes={qrCodes ?? []} employees={employees ?? []} /><section className="admin-section"><div className="section-heading"><div><span className="eyebrow">vCards</span><h2>Employees</h2></div></div><AdminDirectory initialEmployees={employees ?? []} /></section></main>;
}
