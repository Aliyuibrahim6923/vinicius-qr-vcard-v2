import { createHmac, timingSafeEqual } from "node:crypto";
import { after, NextResponse } from "next/server";
import { answerWhatsAppQuestion } from "@/lib/bot-ai";
import { createServiceClient } from "@/lib/supabase/server";
import type { BotSettings } from "@/lib/types";

export const maxDuration = 60;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  if (query.get("hub.mode") === "subscribe" && query.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(query.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Verification failed", { status: 403 });
}

function signatureIsValid(body: string, signature: string | null) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function sendMessage(to: string, body: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";
  if (!token || !phoneId) throw new Error("WhatsApp credentials are not configured.");
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body: body.slice(0, 4000) } }),
  });
  if (!response.ok) throw new Error(`WhatsApp API returned ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const result = await response.json();
  return result.messages?.[0]?.id as string | undefined;
}

async function processMessage(message: { id?: string; from?: string; type?: string; text?: { body?: string } }) {
  if (!message.id || !message.from || message.type !== "text" || !message.text?.body) return;
  const service = createServiceClient();
  const inserted = await service.from("whatsapp_messages").insert({ message_id: message.id, contact_number: message.from, direction: "inbound", body: message.text.body });
  if (inserted.error?.code === "23505") return;
  if (inserted.error) throw inserted.error;
  const { data: settings, error } = await service.from("bot_settings").select("*").eq("id", true).eq("enabled", true).maybeSingle();
  if (error || !settings) return;
  const reply = await answerWhatsAppQuestion(message.text.body, settings as BotSettings);
  const outboundId = await sendMessage(message.from, reply);
  if (outboundId) await service.from("whatsapp_messages").insert({ message_id: outboundId, contact_number: message.from, direction: "outbound", body: reply });
}

export async function POST(request: Request) {
  const body = await request.text();
  if (!signatureIsValid(body, request.headers.get("x-hub-signature-256"))) return new Response("Invalid signature", { status: 401 });
  let payload: { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ id?: string; from?: string; type?: string; text?: { body?: string } }> } }> }> };
  try { payload = JSON.parse(body); } catch { return new Response("Invalid JSON", { status: 400 }); }
  const messages = payload.entry?.flatMap((entry) => entry.changes?.flatMap((change) => change.value?.messages ?? []) ?? []) ?? [];
  after(async () => {
    for (const message of messages) await processMessage(message).catch((error) => console.error("[whatsapp/webhook]", error));
  });
  return NextResponse.json({ received: true });
}
