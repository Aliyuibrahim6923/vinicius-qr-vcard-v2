import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { BotSettings } from "@/lib/types";

export const getPublicBotSettings = cache(async (): Promise<BotSettings | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("bot_settings").select("*").eq("id", true).eq("enabled", true).maybeSingle();
  return data as BotSettings | null;
});
