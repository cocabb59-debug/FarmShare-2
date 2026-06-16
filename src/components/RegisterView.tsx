import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Machine, Role, MachineStatus, BookingStatus } from "../types";
import { db } from "../lib/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import {
  Tractor,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Truck,
  Award,
  DollarSign,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { MachineFormModal } from "./MachineFormModal";

export const RegisterView: React.FC = () => {
  const {
    currentUser,
    userProfile,
    machines,
    myBookingsAsOwner,
    changeRole,
    deleteMachine,
    updateMachine,
    updateBookingStatus,
    login,
  } = useApp();

  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!currentUser) {
    return (
      <div className="bg-slate-50 border border-slate-150 rounded-3xl py-16 text-center max-w-xl mx-auto my-8 p-6 text-slate-500 text-xs">
        <Tractor className="h-12 w-12 text-semibold text-slate-350 mx-auto animate-pulse mb-3" />
        <h3 className="font-extrabold text-slate-700 text-sm">농기계 등록 및 대여 관리를 위해 로그인이 필요합니다</h3>
        <p className="text-slate-400 mt-1">Google 계정으로 편리한 스마트 기기 임대를 시작하세요.</p>
        <button
          onClick={login}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl mt-4 cursor-pointer transition-colors"
        >
          Google 로그인
        </button>
      </div>
    );
  }

  // 1. Onboarding View - For users who are not yet OWNERS
  const isOwner = userProfile && userProfile.role === Role.OWNER;
  const isAdmin = userProfile && userProfile.role === Role.ADMIN;
  
  const handleBecomeOwner = async () => {
    try {
      await changeRole(Role.OWNER);
      setSuccessMsg("대여소유자(🚜) 신분으로 전환되었습니다! 지금 바로 첫 농기계를 등록해보세요.");
    } catch (err: any) {
      setErrorMsg("신분 전환에 실패했습니다: " + err.message);
    }
  };

  if (!isOwner && !isAdmin) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-4 text-left" id="onboarding-root">
        {/* Banner with card header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
            <Tractor className="h-96 w-96 text-white" />
          </div>

          <div className="relative z-10 space-y-4 max-w-xl">
            <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full border border-emerald-500/35">
              LEASING PARTNER ONBOARDING
            </span>
            <h1 className="text-2xl md:text-3xl font-black leading-tight text-white">
              창고에 쉬고 있는 농기계,<br />
              대여 등록하고 쏠쏠한 수익을 올려보세요!
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              모내기가 끝난 이앙기, 수확이 끝난 콤바인 등을 필요한 이웃 농민들에게 대여헤 주세요. 
              안전 보증보험 및 토스 안심 결제 연동으로 파손 리스크 없이 높은 일일 대여 수익을 창출할 수 있습니다.
            </p>
            <div className="pt-2">
              <button
                onClick={handleBecomeOwner}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-3 px-6 rounded-xl flex items-center space-x-2 transition-all cursor-pointer transform hover:scale-[1.02] shadow-md shadow-emerald-900/30"
              >
                <Tractor className="h-4.5 w-4.5" />
                <span>대여 소유자(🚜)로 즉시 전환하기</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Benefits section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-2xs space-y-2">
            <div className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">합리적인 추가 대여 수입</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              사용하지 않고 방치되는 농기계를 원하는 농민들에게 합리적인 가격에 매칭해 유휴 장비 수익률을 최대로 올립니다.
            </p>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-2xs space-y-2">
            <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">확실한 에스크로 & 보험 보장</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              임차 농가의 안심 보증금 에스크로 예치와 대여 전용 스마트 안심 보험 체결로 신고 및 기기 오버하울 리스크를 원천 분쇄합니다.
            </p>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-2xs space-y-2">
            <div className="h-9 w-9 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">Gemini AI 요금 산출 & 문필 비서</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              장비 모델명만 입력하면 최신 AI가 시세 대조를 거친 최적의 하루 임대료를 추정하고 전문 설명 구문을 자동 편찬해 줍니다.
            </p>
          </div>
        </div>

        {/* Local Testimonial Card */}
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex items-start space-x-4">
          <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-extrabold text-sm shrink-0">
            🌾
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 italic">
              "농번기가 끝나면 이앙기를 그냥 보관만 해두어 아까웠는데, 공유마켓에 소유자로 등록해서 3번 대여해주고 한 달 만에 150만 원의 부가 수입이 발생했어요! 보증보험 연동이 확실해서 장비 회수 걱정도 전혀 없습니다."
            </p>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wide">
              — 전북 익산 쌀농업인 오영섭 파트너 (대여소유자)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter machines registered by current user
  const myRegisteredMachines = machines.filter((m) => m.ownerId === currentUser.uid);

  const handleEditMachine = (machine: Machine) => {
    setEditingMachine(machine);
  };

  const handleDeleteMachine = async (id: string) => {
    if (confirm("정말 이 농기계 임대 등록을 해지하고 영구 삭제하시겠습니까? (현재 진행중인 예약 수락 건이 있는 경우 유의바랍니다)")) {
      try {
        await deleteMachine(id);
        setSuccessMsg("장비 등록이 정상 취소 및 소각되었습니다.");
      } catch (err: any) {
        setErrorMsg("삭제 실패: " + err.message);
      }
    }
  };

  // Safe status toggler
  const handleToggleState = async (machine: Machine) => {
    const nextStatus = 
      machine.status === MachineStatus.AVAILABLE 
        ? MachineStatus.MAINTENANCE 
        : machine.status === MachineStatus.MAINTENANCE
        ? MachineStatus.RENTED
        : MachineStatus.AVAILABLE;
        
    try {
      await updateMachine(machine.id, { status: nextStatus });
      setSuccessMsg(`장비 '${machine.title}'의 상태가 [${nextStatus}]로 수정되었습니다.`);
    } catch (err: any) {
      setErrorMsg("장비 상태 갱신에 실패했습니다: " + err.message);
    }
  };

  return (
    <div className="space-y-8 text-left" id="owner-dashboard-root">
      {/* Dashboard master header */}
      <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-sm">
              대여 제휴 파트너 데스크
            </span>
            <span className="text-xs text-slate-400">• v2.5 안정화 정산</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mt-1">내가 소유한 대여 장비 관리</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            유휴 농기계를 플랫폼에 기탁하여 대여를 매개하고 승인 일정과 상태를 검수합니다.
          </p>
        </div>

        <button
          onClick={() => setIsAddingMachine(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-4.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>새 농기계 제안/대여 등록</span>
        </button>
      </div>

      {/* Messages Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-850 text-xs px-4 py-3 rounded-xl border border-emerald-100 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="font-extrabold hover:text-emerald-900 cursor-pointer">
            &times;
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 text-red-650 text-xs px-4 py-3 rounded-xl border border-red-100 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="font-extrabold hover:text-red-900 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Grid segments: A. My Machine holdings, B. Booking approval stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 Columns: Registered Machinery list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-800 text-sm flex items-center space-x-1.5">
              <span>내 농기계 소장 현황</span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {myRegisteredMachines.length}대
              </span>
            </h2>
          </div>

          {myRegisteredMachines.length > 0 ? (
            <div className="space-y-4" id="owner-machine-listings">
              {myRegisteredMachines.map((m) => (
                <div
                  key={m.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs flex items-start justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="h-16 w-16 rounded-xl bg-slate-50 border border-slate-100/80 overflow-hidden shrink-0">
                      <img
                        src={m.imageUrls?.[0] || "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=150&q=80"}
                        alt={m.title}
                        referrerPolicy="no-referrer"
                        className="object-cover h-full w-full"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <div>
                        {/* Status tag */}
                        <button
                          onClick={() => handleToggleState(m)}
                          title="상태 수정 클릭"
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full mr-2 transition-transform hover:scale-105 cursor-pointer ${
                            m.status === MachineStatus.AVAILABLE
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : m.status === MachineStatus.MAINTENANCE
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-red-50 text-red-700 border border-red-100"
                          }`}
                        >
                          {m.status === MachineStatus.AVAILABLE ? "🟢 대여가능" : m.status === MachineStatus.MAINTENANCE ? "🟡 점검수리중" : "🔴 대여중"} (전환)
                        </button>
                        <span className="text-[10px] text-slate-400 font-semibold">{m.category}</span>
                      </div>

                      <h3 className="font-extrabold text-slate-800 text-xs md:text-sm">{m.title}</h3>
                      
                      <div className="flex flex-wrap text-[10.5px] text-slate-400 gap-x-2 gap-y-1">
                        <span>제조: <strong className="text-slate-600">{m.manufacturer}</strong></span>
                        <span>•</span>
                        <span>연식: <strong className="text-slate-600">{m.year}년식</strong></span>
                        <span>•</span>
                        <span>지역: <strong className="text-slate-600">{m.location}</strong></span>
                      </div>

                      <div className="text-[10.5px] text-slate-500 pt-0.5">
                        임대료: <span className="font-bold text-slate-700">{m.dailyPrice.toLocaleString()}원/일</span> 
                        <span className="text-slate-350 ml-1.5">|</span> 보증금: <span className="font-bold text-slate-700">{m.deposit.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col space-y-1.5 shrink-0">
                    <button
                      onClick={() => handleEditMachine(m)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="소개글 및 요금 수정"
                    >
                      <Edit className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMachine(m.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="등록 해지"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 border-dashed rounded-3xl py-16 text-center text-slate-400 mt-2">
              <Tractor className="h-10 w-10 mx-auto text-slate-300 animate-pulse mb-3" />
              <h4 className="font-bold text-slate-700 text-xs">현재 등록 완료된 내 농기계가 비어있습니다.</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                우측 상단 '새 농기계 제안/대여 등록'을 눌러 나만의 유휴 장비를 등록해 이웃과 손잡으세요!
              </p>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Rental Booking Approval Stream directly inside */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="font-black text-slate-800 text-sm flex items-center space-x-1.5">
            <span>내 장비 예약 승인관리</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {myBookingsAsOwner.length}건
            </span>
          </h2>

          {myBookingsAsOwner.length > 0 ? (
            <div className="space-y-3" id="owner-booking-workflow-panel">
              {myBookingsAsOwner.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4.5 space-y-3 shadow-3xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        b.status === BookingStatus.PENDING
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : b.status === BookingStatus.APPROVED
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : b.status === BookingStatus.PAID
                          ? "bg-violet-50 text-violet-700 border border-violet-100"
                          : b.status === BookingStatus.ACTIVE
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : b.status === BookingStatus.COMPLETED
                          ? "bg-slate-50 text-slate-500 border border-slate-150"
                          : "bg-slate-100 text-slate-400"
                      }`}>
                        {b.status === BookingStatus.PENDING ? "대기중 (소요자 승인대대기)": b.status}
                      </span>
                      <h4 className="font-black text-slate-800 text-xs mt-1.5">{b.machineTitle}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400">총 정산예정액</p>
                      <p className="text-xs font-black text-emerald-700">{b.totalPrice.toLocaleString()}원</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg text-[10.5px] text-slate-500 space-y-1">
                    <p>🧑🌾 임차 신청: <strong className="text-slate-700">{b.renterName}</strong> ({b.renterPhone || "전화 미기재"})</p>
                    <p>📅 일정 조율: <strong className="text-slate-600">{b.startDate}</strong> ~ <strong className="text-slate-600">{b.endDate}</strong></p>
                  </div>

                  {/* Actions depending on booking status */}
                  <div className="flex justify-end pt-1">
                    {b.status === BookingStatus.PENDING && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateBookingStatus(b.id, BookingStatus.REJECTED)}
                          className="px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-250 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          반려 거절
                        </button>
                        <button
                          onClick={() => updateBookingStatus(b.id, BookingStatus.APPROVED)}
                          className="px-3 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg cursor-pointer transition-colors"
                        >
                          임대 승인하기
                        </button>
                      </div>
                    )}

                    {b.status === BookingStatus.PAID && (
                      <button
                        onClick={() => updateBookingStatus(b.id, BookingStatus.ACTIVE)}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-black rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>농민 인도완료 (대여 시작 처리)</span>
                      </button>
                    )}

                    {b.status === BookingStatus.ACTIVE && (
                      <button
                        onClick={() => updateBookingStatus(b.id, BookingStatus.COMPLETED)}
                        className="w-full py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-[11.5px] font-black rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>기계 무리 반납 (기사 대여 완료)</span>
                      </button>
                    )}

                    {b.status === BookingStatus.APPROVED && (
                      <span className="text-[10px] text-slate-400 font-bold self-center">
                        ⏳ 임차 농민이 토스 안심 결제로 대여료를 완납하길 대기하는 중입니다.
                      </span>
                    )}

                    {b.status === BookingStatus.COMPLETED && (
                      <span className="text-[10px] text-emerald-600 font-bold self-center flex items-center space-x-1">
                        <Award className="h-3.5 w-3.5" />
                        <span>대여 정산 거래가 무사 완결되었습니다!</span>
                      </span>
                    )}

                    {b.status === BookingStatus.REJECTED && (
                      <span className="text-[10px] text-red-500 font-semibold self-center">
                        차단/예약 반려된 내역입니다.
                      </span>
                    )}

                    {b.status === BookingStatus.CANCELLED && (
                      <span className="text-[10px] text-slate-400 font-semibold self-center">
                        대여자가 임의 철회 취소한 건입니다.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 border-dashed rounded-3xl py-12 text-center text-slate-400">
              <Calendar className="h-9 w-9 mx-auto text-slate-300 mb-2 animate-bounce" />
              <h4 className="font-bold text-slate-700 text-xs">현재 관리할 임대 예약 신청이 없습니다.</h4>
              <p className="text-[10px] text-slate-400/80 mt-1 max-w-xs mx-auto">
                이웃 농민들이 내 등록 장비를 확인하면 대여 승인 요청과 수납 안내가 여기에 즉각 팝바인딩됩니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Embedded conditional Modals inside context */}
      {isAddingMachine && (
        <MachineFormModal onClose={() => setIsAddingMachine(false)} />
      )}
      {editingMachine && (
        <MachineFormModal machine={editingMachine} onClose={() => setEditingMachine(null)} />
      )}
    </div>
  );
};
