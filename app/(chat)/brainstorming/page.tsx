"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Send } from "lucide-react";

type Message = { id: string; role: "user" | "assistant"; content: string };

export default function BrainstormingPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Bonjour ! Je suis là pour vous aider à réfléchir. Sur quel sujet aimeriez-vous brainstormer aujourd'hui ?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/brainstorming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantMessageId = (Date.now() + 1).toString();

      setMessages([...newMessages, { id: assistantMessageId, role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          // Basic parsing for Vercel AI SDK Data Stream protocol
          // Usually texts are prefixed with '0:'
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2));
                assistantContent += text;
                setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: assistantContent } : m));
              } catch (e) {
                // Ignore parse errors on chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col p-6 md:p-10">
      <header className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Lightbulb className="size-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Brainstorming</h1>
            <p className="text-sm text-muted-foreground">
              Mode Socrate : Posez vos idées, je vous aiderai à les structurer en posant les bonnes questions.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col rounded-2xl border border-border/50 bg-card/70 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border/50"
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={onSubmit} className="p-4 border-t border-border/50 bg-background/50 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Partagez votre idée ici..."
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="h-auto aspect-square rounded-xl">
            <Send className="size-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
