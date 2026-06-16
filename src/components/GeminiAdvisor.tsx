import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Machine } from "../types";
import { Sparkles, ArrowRight, Loader } from "lucide-react";

interface GeminiAdvisorProps {
  onSelectMachine: (machine: Machine) => void;
}

export const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({ onSelectMachine }) => {
  const { machines, generateAIRecommend } = useApp() as any;
  const [queryText, setQueryText] = useState("");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState("");
  const [recommendedItems, setRecommendedItems] = useState<Machine[]>([]);
  const [searched, setSearched] = useState(false);

  const handleRecommendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    setLoading(true);
    setSearched(true);
    setAdvice("");
    setRecommendedItems([]);

    try {
      const result = await generateAIRecommend(queryText);
      setAdvice(result.advice);

      if (result.recommendedMachineIds && result.recommendedMachineIds.length > 0) {
        // Filter listed machines matches these IDs
        const matches = machines.filter((m: Machine) =>
          result.recommendedMachineIds.includes(m.id)
        );
        setRecommendedItems(matches);
      }
    } catch (err) {
      console.error(err);
      setAdvice("상담 제안 로딩 도중 일시적 장애가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setQueryText(prompt);
  };

  return (
    <div
      className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-lg border border-emerald-800"
      id="gemini-advisor-card"
    >
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/30">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black tracking-tight flex items-center">
            <span>Gemini 농기계 맞춤형 AI 추천</span>
          </h2>
          <p className="text-emerald-300 text-xs mt-0.5 font-medium">
            농지 정보(작업 유형, 평수 등)를 입력하시면 매칭 장비와 조언을 제안해 드립니다.
          </p>
        </div>
      </div>

      {/* Suggested prompts helper buttons */}
      <div className="flex flex-wrap gap-2 mb-6" id="quick-prompts-row">
        {[
          "🚜 논 1000평 모내기 작업하려고 합니다.",
          "🌱 밭 주말농장 자갈 고르기 추천해줘.",
          "🪵 산간 배수로 정비에 좋은 소형 굴삭기",
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickPrompt(prompt.substring(3))}
            className="bg-emerald-950/50 hover:bg-emerald-850 border border-emerald-800 text-emerald-300 hover:text-emerald-200 text-[11px] font-semibold py-1.5 px-3 rounded-full cursor-pointer transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Custom prompt input fields */}
      <form onSubmit={handleRecommendQuery} className="flex gap-2 mb-6">
        <input
          type="text"
          id="advisor-input"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="예: 우리 밭이 500평정도 되는데 로타리 치기에 알맞은 기계는 무엇일까요?"
          className="flex-1 bg-slate-800 border border-emerald-700/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-emerald-600/60 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          required
        />
        <button
          type="submit"
          id="advisor-submit-btn"
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white px-5 rounded-xl transition-colors cursor-pointer flex items-center space-x-1 shrink-0"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>질문하기</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* AI recommendation replies */}
      {searched && (
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-emerald-800/20 text-xs space-y-4" id="advisor-result-box">
          {loading ? (
            <div className="text-center py-6 text-slate-400 space-y-2">
              <span className="inline-block w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
              <p>농기계 사양 정보와 농경 환경을 매칭시키는 중입니다...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Written advice */}
              <div className="space-y-1.5 text-slate-200 leading-relaxed">
                <p className="font-bold text-emerald-400 text-sm">🌾 Gemini AI 매칭 조언</p>
                <p className="whitespace-pre-wrap">{advice}</p>
              </div>

              {/* Matching listed cards */}
              {recommendedItems.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-emerald-400 text-xs">🚜 추천 임차 농기계 목록</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="advisor-matched-items">
                    {recommendedItems.map((machine) => (
                      <div
                        key={machine.id}
                        onClick={() => onSelectMachine(machine)}
                        className="bg-slate-800/80 border border-emerald-700/30 hover:border-emerald-500 hover:bg-emerald-900 p-3 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all"
                      >
                        <div className="h-12 w-12 rounded-lg bg-emerald-950 overflow-hidden shrink-0">
                          <img
                            src={machine.imageUrls?.[0] || "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=150&q=80"}
                            alt={machine.title}
                            referrerPolicy="no-referrer"
                            className="object-cover h-full w-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-xs truncate">{machine.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {machine.location} • 일일 {machine.dailyPrice.toLocaleString()}원
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
