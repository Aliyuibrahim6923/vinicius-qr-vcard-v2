import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { isAdmin } from "@/lib/admin-auth";
import { createKnowledgeEmbeddings, chunkKnowledge } from "@/lib/bot-ai";
import { isSameOrigin } from "@/lib/request";
import { createServiceClient } from "@/lib/supabase/server";

export const maxDuration = 60;

function safeWebsite(raw: string) {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || host === "localhost" || host === "0.0.0.0" || host === "::1" || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return null;
    return url;
  } catch { return null; }
}

function htmlToText(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

async function extractSource(form: FormData) {
  const type = String(form.get("source_type") ?? "");
  if (type === "website") {
    const url = safeWebsite(String(form.get("source_url") ?? ""));
    if (!url) throw new Error("Enter a safe HTTPS website URL.");
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000), headers: { "User-Agent": "ViniciusKnowledgeBot/1.0" } });
    if (!response.ok) throw new Error(`Website returned ${response.status}.`);
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > 2_000_000) throw new Error("Website content is too large.");
    const html = await response.text();
    if (html.length > 2_000_000) throw new Error("Website content is too large.");
    return { type, text: htmlToText(html), sourceUrl: url.toString(), file: null as File | null };
  }
  if (type === "text") return { type, text: String(form.get("text") ?? ""), sourceUrl: null, file: null as File | null };
  if (type === "document") {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("Choose a PDF, TXT, or Markdown file.");
    if (file.size > 8_388_608) throw new Error("Document must be 8 MB or smaller.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const pdf = await getDocumentProxy(bytes);
      const result = await extractText(pdf, { mergePages: true });
      return { type, text: String(result.text), sourceUrl: null, file };
    }
    if (!/\.(txt|md|markdown)$/i.test(file.name)) throw new Error("Only PDF, TXT, and Markdown files are supported.");
    return { type, text: new TextDecoder().decode(bytes), sourceUrl: null, file };
  }
  throw new Error("Choose a knowledge source type.");
}

export async function POST(request: Request) {
  if (!isSameOrigin(request) || !(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const service = createServiceClient();
  let sourceId: string | null = null;
  try {
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    if (!name || name.length > 120) throw new Error("Enter a source name up to 120 characters.");
    const extracted = await extractSource(form);
    const { data: source, error } = await service.from("bot_knowledge_sources").insert({ source_type: extracted.type, name, source_url: extracted.sourceUrl }).select().single();
    if (error) throw error;
    sourceId = source.id;
    let storagePath: string | null = null;
    if (extracted.file) {
      storagePath = `${source.id}/${extracted.file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const upload = await service.storage.from("bot-knowledge").upload(storagePath, extracted.file, { contentType: extracted.file.type || "text/plain" });
      if (upload.error) throw upload.error;
    }
    const chunks = chunkKnowledge(extracted.text);
    const embeddings = await createKnowledgeEmbeddings(chunks);
    const insert = await service.from("bot_knowledge_chunks").insert(chunks.map((content, index) => ({ source_id: source.id, content, embedding: embeddings[index] })));
    if (insert.error) throw insert.error;
    const { data: ready, error: updateError } = await service.from("bot_knowledge_sources").update({ status: "ready", storage_path: storagePath, error_message: null }).eq("id", source.id).select().single();
    if (updateError) throw updateError;
    return NextResponse.json(ready, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process source.";
    if (sourceId) await service.from("bot_knowledge_sources").update({ status: "error", error_message: message }).eq("id", sourceId);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request) || !(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing source ID" }, { status: 400 });
  const service = createServiceClient();
  const { data } = await service.from("bot_knowledge_sources").select("storage_path").eq("id", id).maybeSingle();
  if (data?.storage_path) await service.storage.from("bot-knowledge").remove([data.storage_path]);
  const { error } = await service.from("bot_knowledge_sources").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
