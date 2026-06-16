import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { MachineCard } from "./MachineCard";
import { Machine, MachineStatus } from "../types";
import { CATEGORIES, REGIONS } from "../lib/constants";
import { Search, Crop, MapPin, Grid, RefreshCw } from "lucide-react";

interface FindViewProps {
  onSelectMachine: (machine: Machine) => void;
  overrideCategory: string; // Passed from quick home dispatch
  overrideRegion: string;
}

export const FindView: React.FC<FindViewProps> = ({
  onSelectMachine,
  overrideCategory,
  overrideRegion,
}) => {
  const { machines, reviews } = useApp();

  // Search filter states
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedRegion, setSelectedRegion] = useState("전체 지역");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Sync state if coming from home search dispatch triggers
  useEffect(() => {
    if (overrideCategory) {
      setSelectedCategory(overrideCategory);
    }
    if (overrideRegion) {
      setSelectedRegion(overrideRegion);
    }
  }, [overrideCategory, overrideRegion]);

  // Clean filtration matching rules
  const filteredMachines = machines.filter((m) => {
    // 1. Category matching
    if (selectedCategory !== "전체" && m.category !== selectedCategory) {
      return false;
    }

    // 2. Region / Location matching
    if (selectedRegion !== "전체 지역" && !m.location.includes(selectedRegion)) {
      return false;
    }

    // 3. Availability check
    if (onlyAvailable && m.status !== MachineStatus.AVAILABLE) {
      return false;
    }

    // 4. Text query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchModel = m.model.toLowerCase().includes(q);
      const matchManufacturer = m.manufacturer.toLowerCase().includes(q);
      const matchLabel = m.description.toLowerCase().includes(q);
      return matchTitle || matchModel || matchManufacturer || matchLabel;
    }

    return true;
  });

  const handleClearFilters = () => {
    setSelectedCategory("전체");
    setSelectedRegion("전체 지역");
    setSearchQuery("");
    setOnlyAvailable(false);
  };

  return (
    <div className="space-y-6 text-left" id="find-view-root">
      {/* Page Title header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">대여 가능 농기계 찾기</h1>
          <p className="text-xs text-slate-400 mt-1">
            원하는 권역별 농기계를 검색하고 기간별로 최저 계약 가격을 조율해 보세요.
          </p>
        </div>

        {/* Free text query box */}
        <div className="relative w-full md:w-80 shrink-0">
          <input
            type="text"
            id="catalog-search-query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="상표, 모델명, 수리 상태 등 입력..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
          <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Categories Horizontal scrollbar pills select */}
      <div className="overflow-x-auto pb-2 flex space-x-2 scrollbar-none" id="categories-scroll-row">
        <button
          onClick={() => setSelectedCategory("전체")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
            selectedCategory === "전체"
              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-350"
          }`}
        >
          종류 전체
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              selectedCategory === cat
                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-350"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Advanced sub-filters settings */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-wrap gap-4 items-center justify-between" id="sub-filters-container">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center space-x-1.5">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-500">지역:</span>
            <select
              value={selectedRegion}
              id="catalog-region-select"
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs py-1.5 px-3 rounded-lg font-medium cursor-pointer"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              id="catalog-only-avail-chk"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded-md border-slate-200 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span>대여 가능 장치만 조회</span>
          </label>
        </div>

        {/* Reset settings button */}
        {(selectedCategory !== "전체" || selectedRegion !== "전체 지역" || searchQuery || onlyAvailable) && (
          <button
            onClick={handleClearFilters}
            className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-bold py-1 px-3 bg-white/60 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>검색 초기화</span>
          </button>
        )}
      </div>

      {/* Grid of listings output */}
      {filteredMachines.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="catalog-listing-grid">
          {filteredMachines.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              reviews={reviews}
              onClick={() => onSelectMachine(machine)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-3xl py-16 text-center text-slate-400 border border-dashed border-slate-200">
          <Grid className="h-12 w-12 mx-auto text-slate-300 animate-pulse mb-3" />
          <h3 className="font-extrabold text-slate-700 text-sm">해당 검색어와 일치하는 기계가 존재하지 않습니다.</h3>
          <p className="text-[11px] text-slate-400 mt-1">검색 항목이나 지역 설정을 변경하거나 초기화해보세요.</p>
        </div>
      )}
    </div>
  );
};
