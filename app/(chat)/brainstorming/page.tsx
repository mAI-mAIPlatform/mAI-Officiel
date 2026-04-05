"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Send } from "lucide-react";
import { useChat } from "@ai-sdk/react";

export default function BrainstormingPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/brainstorming",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Bonjour ! Je suis là pour vous aider à réfléchir. Sur quel sujet aimeriez-vous brainstormer aujourd'hui ?",
      }
    ]
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

        <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-background/50 flex gap-3">
          <input
            value={input}
            onChange={handleInputChange}
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
