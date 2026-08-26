import { createClient } from "@/lib/supabase/server";
import { employeeSchema, normalizeEmployee } from "@/lib/validation";
import { isSameOrigin } from "@/lib/request";
import { randomBytes } from "node:crypto";

async function adminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.app_metadata.role === "admin" ? supabase : null;
}

export async function GET(request: Request) {
  const supabase = await adminClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim();
  let builder = supabase.from("employees").select("*").order("last_name");
  if (query) builder = builder.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,job_title.ilike.%${query}%,department.ilike.%${query}%`);
  const { data, error } = await builder;
  return error ? Response.json({ error: "Unable to load employees" }, { status: 500 }) : Response.json(data);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const supabase = await adminClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = employeeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid employee", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = `profile-${randomBytes(10).toString("hex")}`;
    const { data, error } = await supabase.from("employees").insert({ ...normalizeEmployee(parsed.data), slug }).select().single();
    if (!error) return Response.json(data, { status: 201 });
    if (error.code !== "23505") return Response.json({ error: "Unable to create employee" }, { status: 500 });
  }
  return Response.json({ error: "Unable to allocate a permanent profile address" }, { status: 503 });
}
