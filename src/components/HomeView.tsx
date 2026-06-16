import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { GeminiAdvisor } from "./GeminiAdvisor";
import { MachineCard } from "./MachineCard";
import { CATEGORIES, REGIONS } from "../lib/constants";
import { Machine } from "../types";
import {
  Search,
  Calendar,
  MapPin,
  Tractor,
  TrendingUp,
  ShieldCheck,
  Zap,
  Tag
} from "lucide-react";

interface HomeViewProps {
  onSearchDispatch: (searchParams: { category: string; region: string }) => void;
  onSelectMachine: (machine: Machine) => void;
  onNavigateToTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSearchDispatch,
  onSelectMachine,
  onNavigateToTab,
}) => {
  const { machines, reviews, login, currentUser } = useApp();
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedRegion, setSelectedRegion] = useState("전체 지역");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchDispatch({
      category: selectedCategory === "전체" ? "" : selectedCategory,
      region: selectedRegion === "전체 지역" ? "" : selectedRegion,
    });
  };

  // Seed Helper call to give instant visual testing
  const seedMockupData = async () => {
    if (!currentUser) {
      alert("데이터를 구성하려면 로그인이 필요합니다.");
      login();
      return;
    }
    const { registerMachine } = useApp() as any;
    const { SEED_MACHINES } = await import("../lib/constants");

    try {
      for (const m of SEED_MACHINES) {
        await registerMachine(m);
      }
      alert("성공적으로 테스트 데모 농기계 3대가 등록되었습니다!");
    } catch (err: any) {
      alert("시딩 오류: " + err.message);
    }
  };

  const recentMachines = machines.slice(0, 3);

  return (
    <div className="space-y-10" id="home-view-root">
      {/* Hero Banner Grid section */}
      <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl overflow-hidden shadow-lg p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6" id="home-banner shadow-sm">
        <div className="space-y-4 max-w-xl text-left">
          <span className="bg-emerald-400/30 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
            신뢰할 수 있는 지역기반 농기계 거래
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            필요한 농기계를 <br className="hidden md:inline" />
            <span className="text-emerald-200">쉽고 빠르게</span> 대여하세요
          </h1>
          <p className="text-emerald-100 text-sm md:text-base font-medium leading-relaxed">
            방치된 농장비를 등록해 짭짤한 수익을 얻고, 이웃 농가는 저렴하게 활용하여 지역 영농 성장을 가속합니다.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigateToTab("find")}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-extrabold text-xs px-5 py-3 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              대여 장비 찾아보기
            </button>
            <button
              onClick={() => onNavigateToTab("register")}
              className="bg-emerald-500/80 hover:bg-emerald-600/90 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer border border-emerald-400/30"
            >
              🚜 내 유휴 농기계 대여등록 (대여해주기)
            </button>
            <button
              onClick={() => onNavigateToTab("support")}
              className="bg-emerald-600/50 hover:bg-emerald-700/60 text-emerald-100 font-semibold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer border border-emerald-400/20"
            >
              종합 FAQ 지원
            </button>
          </div>
        </div>

        {/* Decorative graphic card */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-left space-y-4 w-full md:w-80 shrink-0">
          <div className="flex items-center space-x-2">
            <Tractor className="h-6 w-6 text-emerald-300 animate-bounce" />
            <span className="font-bold text-sm">농가 커뮤니티 공유 지수</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs font-semibold">
            <div>
              <p className="text-emerald-300">총 임대 장비</p>
              <p className="text-xl font-black mt-1">{machines.length}대</p>
            </div>
            <div>
              <p className="text-emerald-300">성사 대여건</p>
              <p className="text-xl font-black mt-1">실시간 동기화</p>
            </div>
          </div>

          {machines.length === 0 && (
            <button
              onClick={seedMockupData}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-[11px] py-1.5 px-3 rounded-lg border border-emerald-400/50 cursor-pointer transition-colors"
            >
              ⚡ 원클릭 테스트용 농기계 Seed 데이터 생성
            </button>
          )}
        </div>
      </div>

      {/* Main Search Condition Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl -mt-16 relative z-10 max-w-5xl mx-auto" id="home-search-panel">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Category Dropdown */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Tractor className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              농기계 카테고리
            </label>
            <select
              value={selectedCategory}
              id="search-category-home"
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="전체">종류 전체</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Region Dropdown */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              대여 희방 권역
            </label>
            <select
              value={selectedRegion}
              id="search-region-home"
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Search Dispatch Button */}
          <button
            type="submit"
            id="search-submit-home"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/10"
          >
            <Search className="h-4 w-4" />
            <span>임대 가능 농기계 필터 검색</span>
          </button>
        </form>
      </div>

      {/* Embedded Gemini AI advisor banner */}
      <div className="my-6">
        <GeminiAdvisor onSelectMachine={onSelectMachine} />
      </div>

      {/* Recent machines lists section */}
      <div className="space-y-6 text-left" id="recent-arrivals">
        <div className="flex justify-between items-baseline">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">최근 등록된 공유 농기계</h2>
            <p className="text-xs text-slate-400 mt-1">신규 영농 기기를 대형 보증 및 안전 결제로 선점해 보세요.</p>
          </div>
          <button
            onClick={() => onNavigateToTab("find")}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-0.5 cursor-pointer"
          >
            <span>장비 전체보기</span>
            <span>&rarr;</span>
          </button>
        </div>

        {recentMachines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="g-recent-machines-grid">
            {recentMachines.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                reviews={reviews}
                onClick={() => onSelectMachine(machine)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl py-12 text-center text-slate-400 border border-dashed border-slate-200">
            <Tractor className="h-10 w-10 mx-auto text-slate-300 animate-pulse mb-3" />
            <p className="font-semibold text-xs">현재 등록된 농기계 공유 리스팅이 없습니다.</p>
            <p className="text-[10px] text-slate-400 mt-1">상단의 맛보기 데이터 시드 버튼을 눌러 테스트해보세요!</p>
          </div>
        )}
      </div>

      {/* Safety marketing features banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 text-left">
        <div className="bg-white p-5 rounded-2xl border border-slate-100/60 shadow-2xs space-y-2">
          <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm">합리적 가격 산정</h4>
          <p className="text-slate-500 text-xs leading-relaxed">
            대동, 구보다 등 실제 장비의 평균 시세를 분석하여 임차료 부담을 획기적으로 낮췄습니다.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100/60 shadow-2xs space-y-2">
          <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm">엄격한 신분제 및 PII 격리</h4>
          <p className="text-slate-500 text-xs leading-relaxed">
            농민 전용 Google 실명 안심 가입을 의무화하고, 전화번호 및 상세 주소 등 개인정보를 보호합니다.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100/60 shadow-2xs space-y-2">
          <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <Zap className="h-4 w-4" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm">실시간 스마트 상담</h4>
          <p className="text-slate-500 text-xs leading-relaxed">
            대여 조율, 기기 관리법, 일괄 견적 정산 등 인근 영농 전문가들과 실시간 대화채널로 상담하세요.
          </p>
        </div>
      </div>
    </div>
  );
};
