import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { HelpCircle, Send, Sparkles, User, Loader } from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export const FAQBot: React.FC = () => {
  const { askGeminiFAQ } = useApp() as any;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content:
        "안녕하세요! 농기계 공유마켓 고객지원 AI 비서입니다. 🌾\n대여 규정, 보증금 정책, 대여 장비 이상 발생 조치사항 등 무엇이든 편하게 여쭤보세요!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const rawText = textToSend || input;
    if (!rawText.trim() || loading) return;

    if (!textToSend) setInput("");

    // Add user message to UI
    const newUserMsg: ChatMessage = { role: "user", content: rawText };
    setMessages((prev) => [...prev, newUserMsg]);
    setLoading(true);

    try {
      // Prompt Gemini FAQ routing on server-side proxy
      // Pass previous chat histories to preserve threads
      const conversationHistory = messages.filter((m) => m.content !== "");
      const reply = await askGeminiFAQ(rawText, conversationHistory);

      setMessages((prev) => [...prev, { role: "model", content: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "죄송합니다. 오류가 발생했습니다: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleSend(q);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs flex flex-col h-[70vh]" id="faq-bot-container">
      {/* FAQ Header Bar */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-sm md:text-base">농기계 24시간 FAQ 고객지원</h2>
            <p className="text-[10px] text-slate-400 font-medium">Gemini 3.5 Assistant 가 실시간 안내해 드립니다</p>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-emerald-100">
          <Sparkles className="h-3 w-3" />
          <span>AI 전담 지원</span>
        </div>
      </div>

      {/* Messages layout scrollbox */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex items-start ${isUser ? "flex-row-reverse space-x-reverse" : "space-x-3"}`}
            >
              {/* Profile Icon avatar */}
              <div
                className={`h-7 w-7 rounded-sm flex items-center justify-center shrink-0 ${
                  isUser ? "bg-slate-700 text-white" : "bg-emerald-500 text-white"
                } text-[10px] font-bold`}
              >
                {isUser ? <User className="h-4 w-4" /> : "AI"}
              </div>

              {/* Chat bubbles */}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-3xs ${
                  isUser
                    ? "bg-slate-800 text-white rounded-tr-none"
                    : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="h-7 w-7 rounded-sm bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">
              AI
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-2 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
              <span>답변을 구성하는 중...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested quick prompt cards */}
      {messages.length === 1 && (
        <div className="p-4 bg-slate-50 border-t border-slate-150/40 shrink-0">
          <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">자주 묻는 질문 팁</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="faq-bot-quick-tips">
            {[
              "대여 취소 및 환불 기준이 어떻게 되나요?",
              "기기 대여 중에 고장이 나면 책임 소재는 어떻게 되죠?",
              "임대 보증금 제도의 결제 및 반환 흐름을 알려주세요.",
              "플랫폼 안전보험 가입 서비스를 연계하고 싶습니다.",
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleQuickQuestion(q)}
                className="text-left bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-150/50 hover:border-emerald-200 py-2 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="px-4 py-3 border-t border-slate-100 flex gap-2 bg-slate-50 shrink-0"
      >
        <input
          type="text"
          id="faq-bot-text-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="AI에게 무엇이든 질문하세요..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          required
        />
        <button
          type="submit"
          id="faq-bot-send-btn"
          disabled={loading || !input.trim()}
          className={`px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
            loading || !input.trim() ? "bg-slate-300 cursor-not-allowed" : ""
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
