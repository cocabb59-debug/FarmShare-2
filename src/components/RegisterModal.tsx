import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Role } from "../types";
import { User, Phone, MapPin, CheckCircle, Shield } from "lucide-react";

export const RegisterModal: React.FC = () => {
  const { currentUser, lastError, completeRegistration } = useApp() as any;
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<Role>(Role.USER);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!phone.trim()) {
      setErrorMsg("휴대폰 번호를 입력해 주세요.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("정확한 교류 주소를 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      await completeRegistration(phone, address, role);
    } catch (err: any) {
      setErrorMsg(err.message || "프로필 저장 중 요정 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
      id="register-modal-overlay"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full px-6 py-8" id="register-modal-box">
        <div className="text-center mb-6">
          <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">농가 추가정보 등록</h2>
          <p className="text-slate-500 text-sm mt-1">
            원활한 농기계 대여와 결제를 위해 추가 정보를 등록해 주세요.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg mb-4 border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Read only details from Google accounts */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400">이름 (Google 연동)</label>
            <input
              type="text"
              readOnly
              value={currentUser.displayName || ""}
              className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg py-2 px-3 text-sm focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400">이메일 (Google 연동)</label>
            <input
              type="email"
              readOnly
              value={currentUser.email || ""}
              className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg py-2 px-3 text-sm focus:outline-hidden"
            />
          </div>

          {/* Phone Input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600 flex items-center">
              <Phone className="h-3 w-3 mr-1 text-slate-400" />
              휴대폰 번호 <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="tel"
              id="register-phone-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="예: 010-1234-5678"
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          {/* Address Input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600 flex items-center">
              <MapPin className="h-3 w-3 mr-1 text-slate-400" />
              주소 (면/동 단위까지 정확히 기재) <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              id="register-address-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="예: 경기도 여주시 세종대왕면 마가리 123"
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          {/* User Type selects */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 flex items-center">
              <Shield className="h-3 w-3 mr-1 text-slate-400" />
              가입 유형 선택 <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3" id="register-role-grid">
              <button
                type="button"
                onClick={() => setRole(Role.USER)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all ${
                  role === Role.USER
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span className="text-lg">🧑🌾</span>
                <span>일반 농민</span>
                <span className="text-[10px] font-normal text-slate-400">자가 농경 대여 목적</span>
              </button>

              <button
                type="button"
                onClick={() => setRole(Role.OWNER)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all ${
                  role === Role.OWNER
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span className="text-lg">🚜</span>
                <span>장비 소유자</span>
                <span className="text-[10px] font-normal text-slate-400">유휴 장비 임대 등록</span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            id="register-submit-btn"
            disabled={loading}
            className={`w-full py-2.5 px-4 mt-2 rounded-xl text-white font-medium text-sm transition-all focus:outline-hidden flex items-center justify-center space-x-1 cursor-pointer ${
              loading ? "bg-slate-300" : "bg-emerald-600 hover:bg-emerald-700 shadow-xs"
            }`}
          >
            {loading ? (
              <span>등록하는 중...</span>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>등록 완료하고 플랫폼 시작</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
