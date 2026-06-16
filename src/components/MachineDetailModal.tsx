import React, { useState } from "react";
import { Machine, BookingStatus, MachineStatus, Review } from "../types";
import { useApp } from "../context/AppContext";
import { CATEGORY_IMAGES } from "../lib/constants";
import {
  X,
  MapPin,
  Calendar,
  MessageSquare,
  DollarSign,
  AlertCircle,
  Clock,
  ThumbsUp,
  Star,
  Users
} from "lucide-react";

interface MachineDetailModalProps {
  machine: Machine;
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const MachineDetailModal: React.FC<MachineDetailModalProps> = ({
  machine,
  onClose,
  onNavigateToTab,
}) => {
  const { currentUser, userProfile, createBooking, startChat, reviews, login } = useApp() as any;

  // Booking states
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Process matching reviews
  const matchedReviews: Review[] = reviews.filter((r: Review) => r.machineId === machine.id);
  const avgRating =
    matchedReviews.length > 0
      ? (matchedReviews.reduce((sum, r) => sum + r.rating, 0) / matchedReviews.length).toFixed(1)
      : null;

  // Compute overall booking price
  const calculateTotalPrice = () => {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include start day
    return diffDays * machine.dailyPrice;
  };

  const currentDurationDays = () => {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Chat initiation handler
  const handleStartChat = async () => {
    if (!currentUser) {
      alert("문의하려면 로그인이 필요합니다.");
      login();
      return;
    }
    setChatLoading(true);
    try {
      const roomId = await startChat(machine.ownerId, machine.id, machine.title);
      onClose();
      onNavigateToTab("chats");
    } catch (err: any) {
      setErrorMsg("채팅방을 개설하지 못했습니다: " + err.message);
    } finally {
      setChatLoading(false);
    }
  };

  // Booking request handler
  const handleBookingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentUser) {
      alert("농기계를 예약하려면 로그인이 필요합니다.");
      login();
      return;
    }

    if (!startDateStr || !endDateStr) {
      setErrorMsg("대여 시작일과 반납일을 정확히 선택해 주세요.");
      return;
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (end < start) {
      setErrorMsg("반납일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    // Block owners booking their own equipment
    if (machine.ownerId === currentUser.uid) {
      setErrorMsg("본인이 등록한 장비는 예약할 수 없습니다.");
      return;
    }

    if (machine.status !== MachineStatus.AVAILABLE) {
      setErrorMsg("해당 농기계는 현재 대여 불가능한 상태입니다.");
      return;
    }

    setBookingLoading(true);
    const totalPrice = calculateTotalPrice();

    try {
      await createBooking(machine, startDateStr, endDateStr, totalPrice);
      setSuccessMsg("예약 대기 요청이 소유자에게 전달되었습니다! '내 예약' 탭에서 확인하세요.");
      // Clear dates
      setStartDateStr("");
      setEndDateStr("");
    } catch (err: any) {
      setErrorMsg("예약 요청에 실패했습니다: " + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const primaryImage =
    machine.imageUrls && machine.imageUrls.length > 0
      ? machine.imageUrls[0]
      : CATEGORY_IMAGES[machine.category] || CATEGORY_IMAGES["기타"];

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
      id="detail-modal-overlay"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row text-left"
        id="detail-modal-card"
      >
        {/* Left Column: Image Slide & Reviews lists */}
        <div className="w-full md:w-1/2 bg-slate-50 flex flex-col h-[40vh] md:h-auto overflow-y-auto border-r border-slate-100">
          <div className="relative aspect-video md:aspect-square w-full bg-slate-100 shrink-0">
            <img
              src={primaryImage}
              alt={machine.title}
              referrerPolicy="no-referrer"
              className="object-cover w-full h-full"
            />
            {/* Quick specifications header */}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/80 to-transparent p-4 text-white">
              <span className="text-xs bg-emerald-500/80 backdrop-blur-xs font-semibold px-2 py-1 rounded-sm uppercase">
                {machine.category}
              </span>
              <h2 className="text-lg font-bold mt-1.5">{machine.title}</h2>
            </div>
          </div>

          {/* Genuine Reviews lists */}
          <div className="p-5 flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">농지 대여인들의 평가</h3>
              {avgRating ? (
                <div className="flex items-center text-amber-500 text-sm font-semibold space-x-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{avgRating} / 5.0 ({matchedReviews.length}건)</span>
                </div>
              ) : (
                <span className="text-slate-400 text-xs">최초 대여를 기다리고 있습니다.</span>
              )}
            </div>

            <div className="space-y-3">
              {matchedReviews.map((review) => (
                <div key={review.id} className="bg-white p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">{review.userName}님</span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < review.rating ? "fill-amber-400" : "text-slate-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 line-clamp-3">{review.content}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Complete booking details & rent forms */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[55vh] md:max-h-[90vh]">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-emerald-600 border border-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {machine.manufacturer}
                </span>
                <h1 className="text-2xl font-black text-slate-800 mt-2">{machine.title}</h1>
                <p className="text-sm text-slate-500 mt-1">
                  모델명: {machine.model} • 연식: {machine.year}년형
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full cursor-pointer"
                id="close-detail-modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Price Cards */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-center bg-white p-3 rounded-xl border border-slate-100/50">
                <p className="text-[10px] font-semibold text-slate-400">일 대여 요금</p>
                <p className="text-base font-extrabold text-slate-800 mt-0.5">
                  {machine.dailyPrice.toLocaleString()}원
                </p>
              </div>
              <div className="text-center bg-white p-3 rounded-xl border border-slate-100/50">
                <p className="text-[10px] font-semibold text-slate-400">보증금 (반납 시 반환)</p>
                <p className="text-base font-extrabold text-slate-800 mt-0.5">
                  {machine.deposit.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* Geographical details & Description */}
            <div className="space-y-3">
              <div className="flex items-center text-xs text-slate-600 space-x-1">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-slate-800">위치: </span>
                <span>{machine.location}</span>
                <span className="text-slate-300">|</span>
                <Users className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-800">소유주: </span>
                <span>{machine.ownerName}</span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-800 text-xs mb-1.5">농기계 상태 및 소개</h4>
                <div
                  className="bg-slate-100/30 p-3.5 rounded-xl text-xs text-slate-600 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto"
                  id={`detail-desc-${machine.id}`}
                >
                  {machine.description || "등록된 소개내용이 없습니다."}
                </div>
              </div>
            </div>

            {/* Status alerts */}
            {machine.status !== MachineStatus.AVAILABLE && (
              <div className="bg-amber-50 text-amber-800 text-xs p-3.5 rounded-xl border border-amber-100 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">대여 정지 안내:</span> 현재 점검 또는 이미 임대 중인 상태이므로 예약하실 수 없습니다. 소유주에게 문의하여 상태를 조율하세요.
                </div>
              </div>
            )}

            {/* Reservation form */}
            {machine.status === MachineStatus.AVAILABLE && (
              <form onSubmit={handleBookingRequest} className="border-t border-slate-100 pt-5 space-y-4">
                <h3 className="font-black text-slate-800 text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-emerald-500" />
                  실시간 예약 신청
                </h3>

                <div className="grid grid-cols-2 gap-3" id="booking-dates-grid">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      대여 시작 시점
                    </label>
                    <input
                      type="date"
                      id="booking-start-date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-1.5 px-3 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      반납 일자
                    </label>
                    <input
                      type="date"
                      id="booking-end-date"
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-1.5 px-3 text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Simulated Invoice receipt */}
                {startDateStr && endDateStr && (
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-xs text-slate-700 space-y-2">
                    <div className="flex justify-between">
                      <span>
                        일단가 ({machine.dailyPrice.toLocaleString()}원) x {currentDurationDays()}일
                      </span>
                      <span className="font-semibold">
                        {(machine.dailyPrice * currentDurationDays()).toLocaleString()}원
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-emerald-100/50 pt-2">
                      <span>보증보험 대용 보증금</span>
                      <span className="font-semibold">{machine.deposit.toLocaleString()}원</span>
                    </div>

                    <div className="flex justify-between font-black text-emerald-800 text-sm border-t border-emerald-200 pt-2">
                      <span>합계 결제예정금액</span>
                      <span>{calculateTotalPrice().toLocaleString()}원</span>
                    </div>
                  </div>
                )}

                {/* Messages callbacks */}
                {successMsg && (
                  <div className="bg-emerald-50 text-emerald-700 text-xs p-3.5 rounded-xl border border-emerald-100">
                    {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-100">
                    {errorMsg}
                  </div>
                )}

                {/* Submitting Actions */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleStartChat}
                    disabled={chatLoading}
                    id="booking-chat-btn"
                    className="flex-1 flex items-center justify-center space-x-1 border border-emerald-600 hover:bg-emerald-50 text-emerald-700 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>소유자와 일대일 대화</span>
                  </button>

                  <button
                    type="submit"
                    disabled={bookingLoading || machine.status !== MachineStatus.AVAILABLE}
                    id="booking-submit-btn"
                    className={`flex-1 flex items-center justify-center space-x-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer ${
                      bookingLoading || machine.status !== MachineStatus.AVAILABLE
                        ? "bg-slate-300 pointer-events-none"
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>{bookingLoading ? "예약 요청 중..." : "농기계 대여예약"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
