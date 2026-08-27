import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { isSameOrigin } from "@/lib/request";
import { createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  enabled: z.boolean(),
  company_name: z.string().trim().min(1).max(100),
  whatsapp_number: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/).or(z.literal("")),
  greeting_message: z.string().trim().min(1).max(500),
  system_prompt: z.string().trim().min(20).max(4000),
});

export async function PATCH(request: Request) {
  if (!isSameOrigin(request) || !(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 });
  const { data, error } = await createServiceClient().from("bot_settings").update(parsed.data).eq("id", true).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
