import React, { useState } from "react";
import { Machine, MachineStatus } from "../types";
import { useApp } from "../context/AppContext";
import { CATEGORIES, REGIONS } from "../lib/constants";
import {
  X,
  Sparkles,
  Tractor,
  DollarSign,
  MapPin,
  FileText,
  BadgeAlert,
  Loader
} from "lucide-react";

interface MachineFormModalProps {
  machine?: Machine; // Provided if updating
  onClose: () => void;
}

export const MachineFormModal: React.FC<MachineFormModalProps> = ({ machine, onClose }) => {
  const { registerMachine, updateMachine } = useApp();

  // Basic Details states
  const [title, setTitle] = useState(machine?.title || "");
  const [category, setCategory] = useState(machine?.category || CATEGORIES[0]);
  const [manufacturer, setManufacturer] = useState(machine?.manufacturer || "");
  const [model, setModel] = useState(machine?.model || "");
  const [year, setYear] = useState<number>(machine?.year || new Date().getFullYear());
  const [hourlyPrice, setHourlyPrice] = useState<number>(machine?.hourlyPrice || 10000);
  const [dailyPrice, setDailyPrice] = useState<number>(machine?.dailyPrice || 50000);
  const [weeklyPrice, setWeeklyPrice] = useState<number>(machine?.weeklyPrice || 250000);
  const [deposit, setDeposit] = useState<number>(machine?.deposit || 100000);
  const [description, setDescription] = useState(machine?.description || "");
  const [location, setLocation] = useState(machine?.location || REGIONS[1]);
  const [status, setStatus] = useState<MachineStatus>(machine?.status || MachineStatus.AVAILABLE);
  const [imageUrlInput, setImageUrlInput] = useState(machine?.imageUrls?.[0] || "");

  // AI loading and helper states
  const { generateAIDescription, generateAIPriceSuggestion } = useApp() as any;
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingPrice, setGeneratingPrice] = useState(false);
  const [priceRationale, setPriceRationale] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Handler for AI description generation
  const handleGenerateDescription = async () => {
    if (!title) {
      alert("AI 설명을 작성하려면 먼저 '장비명'을 입력해주세요.");
      return;
    }
    setGeneratingDesc(true);
    setErrorMsg("");
    try {
      const generated = await generateAIDescription({ title, category, manufacturer, model, year });
      setDescription(generated);
    } catch (err: any) {
      setErrorMsg("AI 설명 생성 중 오류: " + err.message);
    } finally {
      setGeneratingDesc(false);
    }
  };

  // Handler for AI price suggestions
  const handleGeneratePriceSuggestion = async () => {
    setGeneratingPrice(true);
    setPriceRationale("");
    setErrorMsg("");
    try {
      const suggestion = await generateAIPriceSuggestion({ category, manufacturer, model, year });
      setHourlyPrice(suggestion.hourlyPrice);
      setDailyPrice(suggestion.dailyPrice);
      setWeeklyPrice(suggestion.weeklyPrice);
      setDeposit(suggestion.deposit);
      setPriceRationale(suggestion.rationale);
    } catch (err: any) {
      setErrorMsg("AI 가격 추천 요금 산출 오류: " + err.message);
    } finally {
      setGeneratingPrice(false);
    }
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !manufacturer || !model) {
      setErrorMsg("필수 입력란을 모두 기재해 주세요.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const payload = {
      title,
      category,
      manufacturer,
      model,
      year: Number(year),
      hourlyPrice: Number(hourlyPrice),
      dailyPrice: Number(dailyPrice),
      weeklyPrice: Number(weeklyPrice),
      deposit: Number(deposit),
      description,
      location,
      status,
      imageUrls: imageUrlInput ? [imageUrlInput] : [],
    };

    try {
      if (machine) {
        await updateMachine(machine.id, payload);
      } else {
        await registerMachine(payload);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg("장비 정보 저장에 실패했습니다: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
      id="form-modal-overlay"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col text-left"
        id="form-modal-card"
      >
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2">
            <Tractor className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-black text-slate-800">
              {machine ? "농기계 정보 수정" : "유휴 농기계 공유 임대 등록"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2 text-slate-400 hover:text-slate-800 rounded-full cursor-pointer"
            id="close-form-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content scrolling body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 md:p-8 space-y-6 flex-1">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
              {errorMsg}
            </div>
          )}

          {/* Core equipment records */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. 기본 농업장비 레코드 기입
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-slate-600">장비 글 대표 제목 *</label>
                <input
                  type="text"
                  id="form-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 대동 프리미엄 이앙기 상태 최고"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">카테고리 *</label>
                <select
                  id="form-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">제조사 *</label>
                <input
                  type="text"
                  id="form-manufacturer-input"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="예: 대동공업, 국제"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">모델명 *</label>
                <input
                  type="text"
                  id="form-model-input"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="예: DM-950"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">기계 연식 (연도) *</label>
                <input
                  type="number"
                  id="form-year-input"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  placeholder="예: 2021"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">소재지역 *</label>
                <select
                  id="form-location-select"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm cursor-pointer"
                >
                  {REGIONS.filter((r) => r !== "전체 지역").map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">대여 상태 고시 *</label>
                <select
                  id="form-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MachineStatus)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm cursor-pointer"
                >
                  <option value={MachineStatus.AVAILABLE}>🟢 대여 가능 (즉시 가능)</option>
                  <option value={MachineStatus.MAINTENANCE}>🟡 점검 수리 중</option>
                  <option value={MachineStatus.RENTED}>🔴 타농가 대여 중</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing configurations with Gemini suggestion helpers */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. 시간/일간 대여 요금 & 안전보증금
              </h3>

              <button
                type="button"
                id="ai-price-btn"
                onClick={handleGeneratePriceSuggestion}
                disabled={generatingPrice}
                className="flex items-center space-x-1 text-slate-700 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer font-semibold shadow-2xs"
              >
                {generatingPrice ? (
                  <Loader className="h-3 w-3 animate-spin text-emerald-500" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                )}
                <span>Gemini 최적요금 제안</span>
              </button>
            </div>

            {priceRationale && (
              <div className="bg-emerald-50 p-3 rounded-xl text-xs text-emerald-800 leading-relaxed border border-emerald-100">
                <span className="font-bold">💡 Gemini의 추천 가격 근거: </span>
                {priceRationale}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4" id="form-pricing-grid">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">시간당 요금 (원/시간)</label>
                <input
                  type="number"
                  id="form-price-hourly"
                  value={hourlyPrice}
                  onChange={(e) => setHourlyPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">일일 요금 (원/일) *</label>
                <input
                  type="number"
                  id="form-price-daily"
                  value={dailyPrice}
                  onChange={(e) => setDailyPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">주간 요금 (원/주)</label>
                <input
                  type="number"
                  id="form-price-weekly"
                  value={weeklyPrice}
                  onChange={(e) => setWeeklyPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">예약 보증금 (원) *</label>
                <input
                  type="number"
                  id="form-price-deposit"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description details & image url */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. 상세 정보 기입 및 설명글
              </h3>

              <button
                type="button"
                id="ai-desc-btn"
                onClick={handleGenerateDescription}
                disabled={generatingDesc}
                className="flex items-center space-x-1 text-slate-700 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer font-semibold shadow-2xs"
              >
                {generatingDesc ? (
                  <Loader className="h-3 w-3 animate-spin text-emerald-500" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                )}
                <span>Gemini 설명글 생성</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">상세 소개 (기어 상태, 사용 요령)*</label>
                <textarea
                  id="form-description-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="대여할 농기계의 구체적인 상태, 인수 방식, 사용법 주의사항 등을 입력하세요."
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs h-32 focus:outline-hidden"
                  required
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">사진 이미지 상세 주소 (URL)</label>
                <input
                  type="url"
                  id="form-image-input"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="예: https://example.com/tractor.jpg (빈칸 시 카테고리 디폴트 사진 제공)"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              id="form-submit-btn"
              disabled={saving}
              className="flex items-center space-x-1 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-sm disabled:bg-slate-300"
            >
              {saving ? <span>저장 중...</span> : <span>장비 등록/수정 완료</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
