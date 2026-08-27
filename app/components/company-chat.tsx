"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "assistant" | "user"; text: string };

function ChatIcon({ close = false }: { close?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{close ? <path d="m6 6 12 12M18 6 6 18" /> : <><path d="M4 4h16v13H9l-5 4V4Z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></>}</svg>;
}

export function CompanyChat({ companyName }: { companyName: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: `Hello! Ask me anything about ${companyName}.` }]);
  const messageEnd = useRef<HTMLDivElement>(null);
  useEffect(() => { messageEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (question.length < 2 || sending) return;
    setInput(""); setSending(true); setMessages((current) => [...current, { role: "user", text: question }]);
    try {
      const response = await fetch("/api/bot/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      const result = await response.json().catch(() => ({}));
      setMessages((current) => [...current, { role: "assistant", text: response.ok ? result.answer : result.error ?? "I could not answer that right now." }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "The assistant is unavailable. Please try again shortly." }]);
    } finally { setSending(false); }
  }

  return <div className={`company-chat${open ? " open" : ""}`}><button className="chat-launcher" type="button" aria-label={open ? "Close company assistant" : `Ask ${companyName}`} aria-expanded={open} aria-controls="company-chat-window" onClick={() => setOpen((current) => !current)}><span className="assistant-button-icon"><ChatIcon close={open} /></span><span><strong>{open ? "Close assistant" : "Ask company assistant"}</strong><small>{open ? "Return to contact card" : "Chat here about the company"}</small></span></button>{open ? <section id="company-chat-window" className="chat-window" role="dialog" aria-label={`${companyName} assistant`}><header><span className="chat-avatar"><ChatIcon /></span><span><strong>{companyName}</strong><small>Company assistant</small></span><i aria-hidden="true" /></header><div className="chat-messages" aria-live="polite">{messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}{sending ? <div className="chat-message assistant typing" aria-label="Assistant is typing"><span /><span /><span /></div> : null}<div ref={messageEnd} /></div><form onSubmit={submit}><label className="sr-only" htmlFor="company-chat-question">Ask about the company</label><input id="company-chat-question" value={input} maxLength={500} onChange={(event) => setInput(event.target.value)} placeholder="Ask about the company…" autoComplete="off" /><button type="submit" disabled={sending || input.trim().length < 2} aria-label="Send question"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 18-8-8 18-2-8-8-2Z" /><path d="m11 13 10-10" /></svg></button></form><p className="chat-disclaimer">AI may make mistakes. Verify important information.</p></section> : null}</div>;
}
