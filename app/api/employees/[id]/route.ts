import { createClient } from "@/lib/supabase/server";
import { employeeSchema, normalizeEmployee } from "@/lib/validation";
import { isSameOrigin } from "@/lib/request";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata.role !== "admin") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = employeeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid employee", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  const { id } = await params;
  const { data, error } = await supabase.from("employees").update(normalizeEmployee(parsed.data)).eq("id", id).select().single();
  if (error?.code === "23505") return Response.json({ error: "That slug is already in use" }, { status: 409 });
  return error ? Response.json({ error: "Unable to update employee" }, { status: 500 }) : Response.json(data);
}
