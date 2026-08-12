"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, LoaderCircle, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "안녕하세요. NOVA AI 컨시어지입니다. 제품 비교부터 예산에 맞는 추천까지, 어떤 선택을 도와드릴까요?",
};

const QUICK_PROMPTS = [
  "출퇴근용 제품 추천해줘",
  "20만원대 제품을 비교해줘",
  "배송과 반품 정책을 알려줘",
];

const INTERNAL_LINK_PATTERN = /(\/products\/[a-z0-9-]+)/g;

function createMessage(role: ChatRole, content: string): ChatMessage {
  return { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`, role, content };
}

function getSessionId() {
  const storageKey = "nova-ai-session";
  const saved = window.sessionStorage.getItem(storageKey);
  if (saved) return saved;
  const next = crypto.randomUUID();
  window.sessionStorage.setItem(storageKey, next);
  return next;
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(INTERNAL_LINK_PATTERN);
  return (
    <>
      {parts.map((part, index) => part.startsWith("/products/")
        ? <a key={`${part}-${index}`} href={part}>상품 보기</a>
        : <span key={`${part}-${index}`}>{part}</span>)}
    </>
  );
}

export function AiConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const requestMessages = useMemo(
    () => messages.filter((message) => message.id !== "welcome").slice(-8).map(({ role, content }) => ({ role, content })),
    [messages],
  );

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, pending]);

  const resetConversation = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setError("");
    window.setTimeout(() => inputRef.current?.focus(), 80);
  };

  const sendMessage = async (rawMessage: string) => {
    const content = rawMessage.trim();
    if (!content || pending) return;

    const userMessage = createMessage("user", content);
    const nextRequestMessages = [...requestMessages, { role: "user" as const, content }].slice(-8);
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");

    if (!isSupabaseConfigured || !supabase) {
      setError("AI 컨시어지 연결을 준비 중입니다. 잠시 후 다시 이용해주세요.");
      return;
    }

    setPending(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("nova-ai-chat", {
        body: {
          messages: nextRequestMessages,
          pagePath: window.location.pathname,
          sessionId: getSessionId(),
        },
      });

      if (invokeError) throw invokeError;
      if (!data || typeof data.message !== "string" || !data.message.trim()) throw new Error("empty_response");
      setMessages((current) => [...current, createMessage("assistant", data.message.trim())]);
    } catch {
      setError("답변을 불러오지 못했습니다. 잠시 후 다시 질문해주세요.");
    } finally {
      setPending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className={`ai-concierge${open ? " open" : ""}`}>
      {open && (
        <section className="ai-panel" role="dialog" aria-modal="false" aria-labelledby="ai-concierge-title">
          <header className="ai-panel-header">
            <div className="ai-identity">
              <span className="ai-avatar" aria-hidden="true"><Sparkles size={16} /></span>
              <div>
                <p>ONLINE · GROQ</p>
                <h2 id="ai-concierge-title">NOVA AI Concierge</h2>
              </div>
            </div>
            <div className="ai-panel-actions">
              <button type="button" onClick={resetConversation} aria-label="대화 새로 시작"><RotateCcw size={16} /></button>
              <button type="button" onClick={() => setOpen(false)} aria-label="AI 컨시어지 닫기"><X size={18} /></button>
            </div>
          </header>

          <div className="ai-message-list" ref={scrollRef} aria-live="polite" aria-busy={pending}>
            {messages.map((message) => (
              <article key={message.id} className={`ai-message ${message.role}`}>
                {message.role === "assistant" && <span className="ai-message-icon" aria-hidden="true"><Bot size={14} /></span>}
                <p><MessageContent content={message.content} /></p>
              </article>
            ))}
            {messages.length === 1 && (
              <div className="ai-quick-prompts" aria-label="추천 질문">
                {QUICK_PROMPTS.map((prompt) => <button type="button" key={prompt} onClick={() => void sendMessage(prompt)}>{prompt}</button>)}
              </div>
            )}
            {pending && (
              <div className="ai-typing" role="status"><LoaderCircle className="spin" size={15} /><span>제품을 살펴보고 있어요</span></div>
            )}
          </div>

          <div className="ai-composer-wrap">
            {error && <p className="ai-error" role="alert">{error}</p>}
            <form className="ai-composer" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="nova-ai-input">NOVA AI에게 질문하기</label>
              <textarea
                id="nova-ai-input"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 600))}
                onKeyDown={handleKeyDown}
                placeholder="제품, 배송, 결제를 물어보세요"
                rows={1}
                disabled={pending}
              />
              <button type="submit" disabled={pending || !input.trim()} aria-label="질문 보내기"><Send size={16} /></button>
            </form>
            <p className="ai-disclaimer">AI 답변은 참고용입니다. 주문·결제 정보는 직접 확인해주세요.</p>
          </div>
        </section>
      )}

      <button
        type="button"
        className="ai-launcher"
        aria-label={open ? "AI 컨시어지 닫기" : "AI 컨시어지 열기"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{open ? <X size={20} /> : <MessageCircle size={21} />}</span>
        {!open && <span className="ai-launcher-copy"><small>NOVA AI</small><strong>무엇을 찾으세요?</strong></span>}
      </button>
    </div>
  );
}
