"use client";

import { FormEvent, useRef, useState } from "react";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export function Chatbot({ shopName }: { shopName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi! I can help with the products currently available at ${shopName}.`
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function openChat() {
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = message.trim();
    if (!question || isSending) return;

    setMessage("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question })
      });
      const data = (await response.json()) as { reply?: string; error?: string };

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.ok
            ? data.reply || "I could not answer that right now."
            : data.error || "I could not answer that right now."
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "I could not answer that right now. Please try again." }
      ]);
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <section
          id="store-assistant"
          aria-label="Store assistant"
          className="mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
        >
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
            <div>
              <h2 className="font-display text-lg font-semibold">Store assistant</h2>
              <p className="text-xs text-white/80">Answers use this shop&apos;s current catalogue.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close store assistant"
              className="rounded p-1 text-xl leading-none hover:bg-white/15"
            >
              ×
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((chatMessage, index) => (
              <p
                key={`${chatMessage.role}-${index}`}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  chatMessage.role === "user"
                    ? "self-end bg-primary text-white"
                    : "self-start bg-secondary/20 text-ink"
                }`}
              >
                {chatMessage.content}
              </p>
            ))}
            {isSending && (
              <p className="self-start rounded-2xl bg-secondary/20 px-3 py-2 text-sm text-ink">
                Thinking...
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-black/10 p-3">
            <input
              ref={inputRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1000}
              placeholder="Ask about our cookies..."
              aria-label="Message the store assistant"
              className="min-w-0 flex-1 rounded-full border border-black/15 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!message.trim() || isSending}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        onClick={isOpen ? () => setIsOpen(false) : openChat}
        aria-expanded={isOpen}
        aria-controls="store-assistant"
        className="rounded-full bg-primary px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {isOpen ? "Close chat" : "Ask us"}
      </button>
    </div>
  );
}
