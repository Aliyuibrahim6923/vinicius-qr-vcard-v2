import { NextResponse } from "next/server";
import { z } from "zod";
import { answerWhatsAppQuestion } from "@/lib/bot-ai";
import { createServiceClient } from "@/lib/supabase/server";
import type { BotSettings } from "@/lib/types";

export const maxDuration = 60;
const schema = z.object({ question: z.string().trim().min(2).max(500) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a question between 2 and 500 characters." }, { status: 400 });
  const service = createServiceClient();
  const source = (request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown").split(",")[0].trim();
  const { data: allowed, error: rateError } = await service.rpc("check_bot_rate_limit", { source });
  if (rateError) return NextResponse.json({ error: "Assistant service is temporarily unavailable." }, { status: 503 });
  if (!allowed) return NextResponse.json({ error: "Too many questions. Please try again in 15 minutes." }, { status: 429 });
  const { data: settings, error } = await service.from("bot_settings").select("*").eq("id", true).eq("enabled", true).maybeSingle();
  if (error || !settings) return NextResponse.json({ error: "The company assistant is currently offline." }, { status: 503 });
  try {
    const answer = await answerWhatsAppQuestion(parsed.data.question, settings as BotSettings);
    return NextResponse.json({ answer });
  } catch (chatError) {
    console.error("[bot/chat]", chatError);
    return NextResponse.json({ error: "I could not answer that right now. Please try again shortly." }, { status: 500 });
  }
}
