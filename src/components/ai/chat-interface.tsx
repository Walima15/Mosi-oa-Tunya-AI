"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { AgentResponse } from "@/lib/services/ai-agent";
import { ActionCard } from "@/components/ai/action-card";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestedActions?: AgentResponse["suggestedActions"];
  actionCard?: AgentResponse["actionCard"];
}

const STARTERS = [
  "Send K5,000 to my mother every month",
  "How much did I send home this year?",
  "Can I afford a K500,000 house in Lusaka?",
  "Convert my dollars when the rate beats 27.5",
  "Pay my daughter's school fees next term",
  "Save 10% of every transfer",
];

export function AiChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });
      const data: AgentResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          suggestedActions: data.suggestedActions,
          actionCard: data.actionCard,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <LogoMark />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-bold">Mosi Agent</h1>
            <p className="text-xs text-success flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success animate-pulse" /> Online
            </p>
          </div>
          <Sparkles className="ml-auto size-5 text-gold" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <LogoMark className="size-16 opacity-80" />
              <h2 className="mt-6 font-[family-name:var(--font-display)] text-xl font-bold">
                What can I help you with?
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted">
                Tell me what you want to achieve with your money. I&apos;ll handle the rest.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-white/[0.03] px-4 py-2 text-xs text-foreground/80 transition-all hover:border-gold/30 hover:bg-gold/5 hover:text-gold"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div className="max-w-[85%]">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                      m.role === "user"
                        ? "rounded-br-md bg-gradient-to-br from-gold-light to-gold text-midnight-900"
                        : "rounded-bl-md bg-white/[0.06] text-foreground/90"
                    )}
                  >
                    {m.content.replace(/\*\*(.*?)\*\*/g, "$1")}
                  </div>
                  {m.actionCard && <ActionCard card={m.actionCard} />}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.suggestedActions.map((a) => (
                        <button
                          key={a.action}
                          onClick={() => send(a.label)}
                          className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 transition-colors"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin text-gold" /> Mosi is thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-border px-4 py-4 sm:px-6">
        <form
          className="mx-auto flex max-w-3xl items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); send(input); }}
        >
          <button type="button" className="shrink-0 rounded-full p-3 text-muted hover:bg-white/5 hover:text-cyan-accent transition-colors" aria-label="Voice input">
            <Mic className="size-5" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Mosi what you want to achieve…"
            className="flex-1 rounded-2xl border border-border bg-white/[0.03] px-4 py-3 text-sm placeholder:text-muted/60 focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/15"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send />
          </Button>
        </form>
      </div>
    </div>
  );
}
