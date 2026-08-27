import { embed, embedMany, generateText } from "ai";
import { createServiceClient } from "@/lib/supabase/server";
import type { BotSettings } from "@/lib/types";

const embeddingModel = process.env.AI_EMBEDDING_MODEL || "openai/text-embedding-3-small";
const chatModel = process.env.AI_CHAT_MODEL || "openai/gpt-5.6-luna";

export function chunkKnowledge(input: string, size = 1200, overlap = 180) {
  const text = input.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += size - overlap) {
    const raw = text.slice(start, start + size);
    if (raw.length < 80 && chunks.length) break;
    chunks.push(raw);
  }
  return chunks;
}

export async function createKnowledgeEmbeddings(chunks: string[]) {
  if (!chunks.length) throw new Error("No readable knowledge was found.");
  const { embeddings } = await embedMany({ model: embeddingModel, values: chunks });
  return embeddings;
}

export async function answerWhatsAppQuestion(question: string, settings: BotSettings) {
  const { embedding } = await embed({ model: embeddingModel, value: question });
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("match_bot_knowledge", {
    query_embedding: embedding,
    match_threshold: 0.2,
    match_count: 6,
  });
  if (error) throw error;
  const context = (data ?? []).map((row: { content: string }) => row.content).join("\n\n---\n\n");
  if (!context) return `I don't have that information yet. Please contact ${settings.company_name} directly for help.`;

  const { text } = await generateText({
    model: chatModel,
    system: `${settings.system_prompt}\nNever invent company facts. Keep replies concise and use plain text without Markdown formatting.`,
    prompt: `Approved company knowledge:\n${context}\n\nCustomer question: ${question}`,
  });
  return text.trim();
}
