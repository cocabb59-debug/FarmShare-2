import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "motion/react";
import { 
  ShieldAlert, 
  X, 
  HelpCircle, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  UserCheck, 
  ArrowRight,
  Sparkles,
  Tractor,
  AlertCircle
} from "lucide-react";
import { Role } from "../types";

export const AuthErrorModal: React.FC = () => {
  const { 
    authError, 
    clearAuthError, 
    loginWithEmail, 
    registerWithEmail 
  } = useApp();

  // Mode state
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("010-1234-5678");
  const [address, setAddress] = useState("충청남도 천안시 서북구");
  const [role, setRole] = useState<Role>(Role.USER);

  // Status
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");

  if (!authError) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setLocalSuccess("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error("이름을 입력해주세요.");
        if (password.length < 6) throw new Error("비밀번호는 최소 6자리 이상이어야 합니다.");
        
        await registerWithEmail(email, password, name, phone, address, role);
        setLocalSuccess("성공적으로 회원가입 및 로그인이 완료되었습니다!");
      } else {
        await loginWithEmail(email, password);
        setLocalSuccess("로그인 성공!");
      }
      setTimeout(() => {
        clearAuthError();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "인증 처리 중 오류가 발생했습니다.";
      if (err.code === "auth/invalid-credential") {
        errMsg = "이메일 또는 비밀번호가 올바르지 않습니다.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "이미 존재하거나 가입된 이메일 주소입니다.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "올바른 이메일 형식이 아닙니다.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "비밀번호 보안 강도가 너무 약합니다. (최소 6자)";
      }
      setLocalError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Pre-filled Quick Testing Login Bypasses
  const handleQuickDemo = async (demoType: "renter" | "owner") => {
    setLocalError("");
    setLoading(true);
    const demoEmail = demoType === "renter" ? "renter1@nongmin.com" : "owner1@nongmin.com";
    const demoPass = "nongmin1234";
    const demoName = demoType === "renter" ? "홍길동 (임차농민)" : "김유신 (대여소유자)";
    const demoPhone = demoType === "renter" ? "010-9999-8888" : "010-7777-6666";
    const demoAddr = demoType === "renter" ? "전라남도 나주시 농식품로" : "경상북도 안동시 퇴계로";
    const demoRole = demoType === "renter" ? Role.USER : Role.OWNER;

    try {
      // 1. Try Simple Login first
      await loginWithEmail(demoEmail, demoPass);
      setLocalSuccess(`${demoName} 계정으로 로그인되었습니다!`);
      setTimeout(() => clearAuthError(), 1200);
    } catch (loginErr: any) {
      // 2. If login fails because user doesn't exist yet, automatically auto-register and sign in
      try {
        await registerWithEmail(demoEmail, demoPass, demoName, demoPhone, demoAddr, demoRole);
        setLocalSuccess(`새로운 데모 ${demoType === "renter" ? "임차인" : "소유자"} 계정이 생성되어 즉시 로그인되었습니다!`);
        setTimeout(() => clearAuthError(), 1500);
      } catch (regErr: any) {
        setLocalError("데모 계정 생성에 실패했습니다: " + (regErr.message || String(regErr)));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden text-left"
        id="auth-error-modal"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-6 relative">
          <div className="absolute right-4 top-4">
            <button
              onClick={clearAuthError}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="bg-emerald-500/30 text-emerald-300 font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              보안 해결 가이드 & 이메일 간편인증
            </span>
            <h3 className="font-extrabold text-white text-base md:text-lg">
              농기계 비서에 찾아오신 것을 환영합니다!
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Google Workspace / AI Studio 보안 제한 정책으로 인해 Google 간편 로그인이 실패하였거나, 콘솔 권한 메시지가 뜨셨나요?
            </p>
          </div>
        </div>

        {/* Info Box about the Firebase Permission Error */}
        <div className="p-5 border-b border-slate-100 bg-amber-50/50 space-y-2">
          <div className="flex items-start space-x-2.5 text-xs text-slate-650 leading-relaxed">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-black text-slate-800">
                "설정을 관리하려면 프로젝트 소유자에게 권한을 요청하세요" 메시지 안내
              </p>
              <p className="text-slate-500 mt-1">
                이 프로젝트의 Firebase 환경은 <strong>Google AI Studio가 자동으로 전용 생성한 프라이빗 샌드박스</strong>이므로, 개별 Google 계정으로는 Firebase 콘솔 관리 권한에 직접 접근할 수 없습니다. 
              </p>
              <p className="text-emerald-700 font-bold mt-1">
                👉 설정 변경 필요 없이 아래의 <strong>이메일 회원가입 및 데모 로그인</strong>을 사용하시면 사이트 내의 모든 임대, 등록, AI 요금 제안, 채팅 기능을 100% 한계 없이 완벽하게 이용하실 수 있습니다!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body & Auth Choice Form */}
        <div className="p-6 space-y-5">
          
          {/* Quick Demo Login Option */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
              🚀 1초 만에 바로 테스트하기 (추천)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickDemo("renter")}
                disabled={loading}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 hover:border-emerald-300 text-emerald-800 rounded-xl p-3 text-center transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="font-black text-xs">🌾 임차농민 데모 로그인</div>
                <div className="text-[9.5px] text-emerald-600 mt-0.5">농기계 구인 및 예약 대여 신청</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("owner")}
                disabled={loading}
                className="bg-sky-50 hover:bg-sky-100 border border-sky-200/60 hover:border-sky-300 text-sky-800 rounded-xl p-3 text-center transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="font-black text-xs">🚜 대여소유주 데모 로그인</div>
                <div className="text-[9.5px] text-sky-600 mt-0.5">내 유휴 농기계 등록 및 임대 관리</div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold">또는 직접 이메일로 가입/로그인</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {localError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">
                ⚠️ {localError}
              </div>
            )}
            {localSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-semibold">
                🎉 {localSuccess}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>이메일 주소</span>
              </label>
              <input
                type="email"
                required
                placeholder="nongmin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-hidden font-medium"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>비밀번호 (6자 이상)</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-hidden font-medium"
              />
            </div>

            {/* Conditional Sign-Up Fields */}
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3.5 pt-1.5 border-t border-slate-100"
              >
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>성함 또는 단체명</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-hidden font-medium"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>연락처</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-hidden font-medium"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>실제 거주 대여 지역</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="충청남도 천안시 서북구"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-hidden font-medium"
                  />
                </div>

                {/* Role Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-black text-slate-800 block">
                    🧑🌾 가입하실 신분/역할 선택
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole(Role.USER)}
                      className={`p-2.5 rounded-xl text-xs font-black border text-center transition-all cursor-pointer ${
                        role === Role.USER
                          ? "bg-emerald-600 text-white border-emerald-650 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      🚜 농기계 임차인 (대여자)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole(Role.OWNER)}
                      className={`p-2.5 rounded-xl text-xs font-black border text-center transition-all cursor-pointer ${
                        role === Role.OWNER
                          ? "bg-emerald-600 text-white border-emerald-650 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      ⚙️ 농기계 소유자 (임대인)
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Toggle Sign Up Button */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[11.5px] text-emerald-650 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                {isSignUp ? "이미 계정이 있으신가요? 로그인하기" : "기계 등록 및 이웃과 매칭을 위한 계정 생성하기 →"}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <span>{isSignUp ? "이메일 회원가입 완료 및 로그인" : "이메일 로그인 완료"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4.5 flex justify-end gap-2">
          <button
            onClick={clearAuthError}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            취소 / 창 닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};
