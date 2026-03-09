'use client';

import { useState, useEffect } from "react";
import { X, Send, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AIMentor() {
  const [open, setOpen] = useState(false);

  // Listen for custom event from Home page
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-ai-mentor", handler);
    return () => window.removeEventListener("open-ai-mentor", handler);
  }, []);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: "היי! 👋 אני המנטור AI שלך. אני יכול לעזור לך למצוא קורסים, הקלטות, או לענות על שאלות. במה אוכל לעזור?" },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: input },
      { role: "ai", text: "שאלה מצוינת! תן לי לבדוק בשבילך. זו תשובת דמו — שילוב AI מלא בקרוב! 🚀" },
    ]);
    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-2xl gradient-primary float-shadow flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {open ? (
          <X className="h-6 w-6 text-primary-foreground" />
        ) : (
          <Bot className="h-6 w-6 text-primary-foreground" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 glass-card rounded-2xl elevated-shadow overflow-hidden">
          <div className="gradient-primary px-4 py-3 flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary-foreground" />
            <span className="font-bold text-primary-foreground">מנטור AI</span>
            <span className="mr-auto text-xs text-primary-foreground/70">מקוון</span>
          </div>
          <div className="h-80 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-card/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-lg"
                      : "bg-secondary text-secondary-foreground rounded-bl-lg"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t bg-card/80 flex gap-2">
            <Input
              placeholder="שאל אותי כל דבר..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 h-9 rounded-full bg-secondary border-0"
            />
            <Button size="icon" className="h-9 w-9 rounded-full" onClick={send}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
