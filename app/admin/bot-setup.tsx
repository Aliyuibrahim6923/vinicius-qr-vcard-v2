"use client";

import { useState } from "react";
import type { BotSettings, KnowledgeSource } from "@/lib/types";

async function apiResult(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { error: "The server returned an invalid response." }; }
}

export function BotSetup({ initialSettings, initialSources }: { initialSettings: BotSettings; initialSources: KnowledgeSource[] }) {
  const [settings, setSettings] = useState(initialSettings);
  const [sources, setSources] = useState(initialSources);
  const [sourceType, setSourceType] = useState<KnowledgeSource["source_type"]>("website");
  const [saving, setSaving] = useState(false);
  const [training, setTraining] = useState(false);
  const [message, setMessage] = useState("");

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const response = await fetch("/api/bot/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    const result = await apiResult(response); setSaving(false);
    if (!response.ok) return setMessage(result.error ?? "Unable to save settings.");
    setSettings(result); setMessage("Bot settings saved.");
  }

  async function train(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setTraining(true); setMessage("");
    const form = event.currentTarget;
    const response = await fetch("/api/bot/knowledge", { method: "POST", body: new FormData(form) });
    const result = await apiResult(response); setTraining(false);
    if (!response.ok) return setMessage(result.error ?? "Unable to train this source.");
    setSources((current) => [result, ...current]); form.reset(); setSourceType("website"); setMessage("Knowledge source processed successfully.");
  }

  async function removeSource(source: KnowledgeSource) {
    if (!window.confirm(`Remove “${source.name}” from the bot knowledge?`)) return;
    const response = await fetch(`/api/bot/knowledge?id=${encodeURIComponent(source.id)}`, { method: "DELETE" });
    const result = await apiResult(response);
    if (!response.ok) return setMessage(result.error ?? "Unable to remove source.");
    setSources((current) => current.filter((item) => item.id !== source.id));
  }

  return <section className="admin-section bot-setup"><div className="section-heading"><div><span className="eyebrow">WhatsApp AI</span><h2>Company assistant</h2><p>Configure the public WhatsApp action and train replies from approved company material.</p></div></div>{message ? <p className={message.includes("success") || message.includes("saved") ? "success" : "error"} role="status">{message}</p> : null}<div className="bot-grid"><form className="panel bot-panel employee-form" onSubmit={saveSettings}><div className="form-heading"><div><h3>Assistant settings</h3><p>The assistant remains offline until enabled and provider credentials are configured.</p></div></div><label className="check"><input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} /> Enable company assistant</label><label>Company name<input required value={settings.company_name} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} /></label><label>WhatsApp business number<small>International format, such as +2348012345678.</small><input value={settings.whatsapp_number} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} placeholder="+234..." /></label><label>Card greeting message<textarea rows={3} value={settings.greeting_message} onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })} /></label><label>Assistant instructions<textarea rows={7} value={settings.system_prompt} onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })} /></label><button className="button" disabled={saving}>{saving ? "Saving…" : "Save assistant settings"}</button></form><form className="panel bot-panel employee-form" onSubmit={train}><div className="form-heading"><div><h3>Training knowledge</h3><p>Add an HTTPS page, approved text, or a PDF/TXT/Markdown document.</p></div></div><input type="hidden" name="source_type" value={sourceType} /><label>Source type<select value={sourceType} onChange={(e) => setSourceType(e.target.value as KnowledgeSource["source_type"])}><option value="website">Website page</option><option value="document">Document</option><option value="text">Pasted text</option></select></label><label>Source name<input name="name" required placeholder="Company overview" /></label>{sourceType === "website" ? <label>HTTPS page URL<input name="source_url" type="url" required placeholder="https://example.com/about" /></label> : null}{sourceType === "document" ? <label>Document<input name="file" type="file" required accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown" /><small>Maximum 8 MB.</small></label> : null}{sourceType === "text" ? <label>Approved information<textarea name="text" rows={9} required placeholder="Paste company information here…" /></label> : null}<button className="button" disabled={training}>{training ? "Processing and training…" : "Add to knowledge"}</button></form></div><div className="knowledge-list"><h3>Knowledge sources</h3>{sources.length ? sources.map((source) => <div className="employee-row" key={source.id}><div className="knowledge-icon" aria-hidden="true">{source.source_type === "website" ? "WEB" : source.source_type === "document" ? "DOC" : "TXT"}</div><div className="employee-copy"><strong>{source.name}</strong><small>{source.status}{source.error_message ? ` — ${source.error_message}` : ""}</small></div><button className="text-button" type="button" onClick={() => removeSource(source)}>Remove</button></div>) : <p className="empty-note">No training sources yet. Add approved information above.</p>}</div></section>;
}
