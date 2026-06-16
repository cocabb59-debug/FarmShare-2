import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Booking, BookingStatus, Role } from "../types";
import { db } from "../lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import {
  Calendar,
  DollarSign,
  Briefcase,
  CheckCircle,
  XCircle,
  Truck,
  Star,
  FileEdit,
  ShieldCheck,
  CreditCard,
  CreditCard as Wallet,
  MessageSquare
} from "lucide-react";

export const BookingsView: React.FC = () => {
  const {
    currentUser,
    userProfile,
    myBookingsAsRenter,
    myBookingsAsOwner,
    updateBookingStatus,
    cancelBooking,
    addReview,
    login,
  } = useApp();

  // Active sub-navigation: "대여인 예약 내역" vs "나의 기계 소유 차트"
  const [panelMode, setPanelMode] = useState<"renter" | "owner">("renter");

  // Payment simulated dialogue states
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"toss" | "kakao" | "card" | "bank">("toss");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Review dialogue states
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewProcessing, setReviewProcessing] = useState(false);

  // Error callbacks
  const [alertMsg, setAlertMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!currentUser) {
    return (
      <div className="bg-slate-50 border border-slate-150 rounded-3xl py-16 text-center max-w-xl mx-auto my-8 p-6 text-slate-500 text-xs">
        <Calendar className="h-12 w-12 text-slate-300 mx-auto animate-pulse mb-3" />
        <h3 className="font-extrabold text-slate-700 text-sm">예약 및 대여관리를 위해 로그인이 필요합니다</h3>
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

  // Active collection lists based on sub-tab panel
  const activeBookings = panelMode === "renter" ? myBookingsAsRenter : myBookingsAsOwner;

  // Formatting rules for badges
  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return (
          <span className="bg-amber-100/70 border border-amber-200 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
            대기중 (소유자 승인대기)
          </span>
        );
      case BookingStatus.APPROVED:
        return (
          <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
            승인됨 (결제 대기)
          </span>
        );
      case BookingStatus.REJECTED:
        return (
          <span className="bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
            예약 반려
          </span>
        );
      case BookingStatus.PAID:
        return (
          <span className="bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
            결제완료 (차량 수령준비)
          </span>
        );
      case BookingStatus.ACTIVE:
        return (
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
            사용 중 (대여 중)
          </span>
        );
      case BookingStatus.COMPLETED:
        return (
          <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
            반납 완료
          </span>
        );
      case BookingStatus.CANCELLED:
        return (
          <span className="bg-slate-50 border border-slate-150 text-slate-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
            예약 취소
          </span>
        );
      default:
        return null;
    }
  };

  // Simulated Payment Execution
  const triggerSimulationPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBooking) return;

    setPaymentProcessing(true);
    setAlertMsg("");

    try {
      const paymentId = "pay_" + Date.now();
      // Record payment receipt
      await setDoc(doc(db, "payments", paymentId), {
        id: paymentId,
        bookingId: payingBooking.id,
        renterId: payingBooking.renterId,
        amount: payingBooking.totalPrice,
        method: paymentMethod,
        status: "APPROVED",
        createdAt: new Date().toISOString(),
      });

      // Update Booking code state internally
      await updateBookingStatus(payingBooking.id, BookingStatus.PAID);
      setSuccessMsg("결제가 정상 승인되었습니다! 장비 수령 일정을 확인해 보세요.");
      setPayingBooking(null);
    } catch (err: any) {
      setAlertMsg("Payment Error: " + err.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Submit Review Execution
  const triggerSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingBooking) return;

    setReviewProcessing(true);
    try {
      await addReview(reviewingBooking.id, reviewingBooking.machineId, rating, reviewContent);
      setSuccessMsg("성의 가득한 대여 후기가 등록되었습니다. 대단히 감사드립니다!");
      setReviewingBooking(null);
      setReviewContent("");
    } catch (err: any) {
      setAlertMsg("후기 작성 중 결함 발생: " + err.message);
    } finally {
      setReviewProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left" id="bookings-view-root">
      {/* Tab select header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">예약 및 기계 관리</h1>
          <p className="text-xs text-slate-400 mt-1">
            농가 대여 현황을 직관적으로 승인 결제하고, 사용 일정에 마운트해 보세요.
          </p>
        </div>

        {/* Dynamic Dual dashboard switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-150 self-start sm:self-auto">
          <button
            onClick={() => setPanelMode("renter")}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              panelMode === "renter" ? "bg-white text-emerald-700 shadow-3xs" : "text-slate-500"
            }`}
          >
            🧑🌾 내가 대여한 장비 내역
          </button>
          <button
            onClick={() => setPanelMode("owner")}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              panelMode === "owner" ? "bg-white text-emerald-700 shadow-3xs" : "text-slate-500"
            }`}
          >
            🚜 내 장비 예약 승인관리
          </button>
        </div>
      </div>

      {/* Messages Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-750 text-xs px-4 py-3 rounded-xl border border-emerald-100 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="font-extrabold hover:text-emerald-900 cursor-pointer">
            &times;
          </button>
        </div>
      )}
      {alertMsg && (
        <div className="bg-red-50 text-red-650 text-xs px-4 py-3 rounded-xl border border-red-100 flex items-center justify-between">
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg("")} className="font-extrabold hover:text-red-900 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* List items representation */}
      {activeBookings.length > 0 ? (
        <div className="space-y-4" id="bookings-collection">
          {activeBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              id={`booking-receipt-holder-${b.id}`}
            >
              {/* Thumbnail and Spec text block */}
              <div className="flex items-start space-x-4">
                <div className="h-16 w-16 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                  <img
                    src={b.machineImageUrl || "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=150&q=80"}
                    alt={b.machineTitle}
                    referrerPolicy="no-referrer"
                    className="object-cover h-full w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-slate-800 text-sm md:text-base line-clamp-1">
                      {b.machineTitle}
                    </h3>
                    <span>{renderStatusBadge(b.status)}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    대여 기간: <span className="font-bold text-slate-700">{b.startDate}</span> ~{" "}
                    <span className="font-bold text-slate-700">{b.endDate}</span>
                  </p>

                  <div className="flex items-center text-[10px] text-slate-400 space-x-2">
                    <span>예약고유키: {b.id}</span>
                    <span>•</span>
                    <span>
                      {panelMode === "renter" ? `임대 제공: ${b.ownerId.slice(0, 5)}` : `임차 신청농민: ${b.renterName}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout rate details & Action Buttons panel */}
              <div className="flex flex-col md:items-end space-y-1.5 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                <p className="text-xs text-slate-400">총 예정 결제액(보증금 포함)</p>
                <p className="text-base font-black text-slate-800">
                  {b.totalPrice.toLocaleString()}원
                </p>

                {/* Submitting conditional widgets */}
                <div className="flex flex-wrap gap-2 pt-2 md:justify-end">
                  {/* RENTER CONTROLS */}
                  {panelMode === "renter" && (
                    <>
                      {/* Cancel pending reservation */}
                      {b.status === BookingStatus.PENDING && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                        >
                          예약 취소
                        </button>
                      )}

                      {/* Pay for approved reservation */}
                      {b.status === BookingStatus.APPROVED && (
                        <button
                          onClick={() => setPayingBooking(b)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                          <span>안심 대여료 결제하기</span>
                        </button>
                      )}

                      {/* Review writing on completion */}
                      {b.status === BookingStatus.COMPLETED && (
                        <button
                          onClick={() => setReviewingBooking(b)}
                          className="px-3.5 py-1.5 bg-white border border-emerald-600/30 hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          <span>후기작성/평가 등록</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* OWNER CONTROLS */}
                  {panelMode === "owner" && (
                    <>
                      {/* Approve/Reject incoming booking request */}
                      {b.status === BookingStatus.PENDING && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateBookingStatus(b.id, BookingStatus.REJECTED)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                          >
                            거절 반려
                          </button>
                          <button
                            onClick={() => updateBookingStatus(b.id, BookingStatus.APPROVED)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            임대 승인
                          </button>
                        </div>
                      )}

                      {/* Launch status active once renters paid */}
                      {b.status === BookingStatus.PAID && (
                        <button
                          onClick={() => updateBookingStatus(b.id, BookingStatus.ACTIVE)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>인수 완료 (대여 시작)</span>
                        </button>
                      )}

                      {/* Resolve returning to complete when device returned */}
                      {b.status === BookingStatus.ACTIVE && (
                        <button
                          onClick={() => updateBookingStatus(b.id, BookingStatus.COMPLETED)}
                          className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>기계 반납 검수완료</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl py-16 text-center text-slate-400 border border-dashed border-slate-200">
          <Calendar className="h-12 w-12 mx-auto text-slate-300 animate-pulse mb-3" />
          <h3 className="font-extrabold text-slate-700 text-sm">대여 및 소유 예약 내역이 불투명합니다.</h3>
          <p className="text-[11px] text-slate-400 mt-1">대여 가능한 농기계를 찾아보고 예약 요청을 보내보세요!</p>
        </div>
      )}

      {/* MODAL 1: Simulated Payment Portal Checkout Drawer */}
      {payingBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={triggerSimulationPayment}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full px-6 py-6 text-left space-y-5"
            id="simulated-payment-form"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h3 className="font-extrabold text-slate-800 text-sm">Toss 안심 안전결제 연동</h3>
              </div>
              <button
                type="button"
                onClick={() => setPayingBooking(null)}
                className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Price invoice cards */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-2">
              <p className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">결제 대상 명세서</p>
              <h4 className="font-bold text-slate-800 text-sm">{payingBooking.machineTitle}</h4>

              <div className="flex justify-between border-t border-slate-200/50 pt-2 text-slate-500">
                <span>합계요금(일 단위 청구)</span>
                <span>{payingBooking.totalPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between font-black text-emerald-800 text-sm border-t border-slate-200 pt-2">
                <span>총 최종 결제 승인액</span>
                <span>{payingBooking.totalPrice.toLocaleString()}원</span>
              </div>
            </div>

            {/* Payment methods choices */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 flex items-center">
                <CreditCard className="h-3.5 w-3.5 mr-1" />
                결제 안전 연계 선택
              </label>

              <div className="grid grid-cols-2 gap-2" id="payment-gateways">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("toss")}
                  className={`py-3 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === "toss"
                      ? "border-blue-500 bg-blue-50 text-blue-750"
                      : "border-slate-150 bg-white text-slate-600"
                  }`}
                >
                  토스페이 (Toss)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("kakao")}
                  className={`py-3 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === "kakao"
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-slate-150 bg-white text-slate-600"
                  }`}
                >
                  카카오페이 (Kakao)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`py-3 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-150 bg-white text-slate-600"
                  }`}
                >
                  일반 신용카드 결제
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`py-3 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === "bank"
                      ? "border-slate-800 bg-slate-50 text-slate-800"
                      : "border-slate-150 bg-white text-slate-600"
                  }`}
                >
                  실시간 계좌 이체
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 leading-relaxed">
              * Toss Payments 및 카카오뱅크 가맹 안심 거래 표준을 따르며, 대여 완료 검수 후 입금액이 기소유자 전용 계좌로 정산 지급됩니다.
            </div>

            <button
              type="submit"
              disabled={paymentProcessing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-extrabold text-xs cursor-pointer shadow-sm disabled:bg-slate-350"
            >
              {paymentProcessing ? "인증 서명 검증 중..." : "결제 계약 승인하기"}
            </button>
          </form>
        </div>
      )}

      {/* MODAL 2: Review dialogue entry form */}
      {reviewingBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={triggerSubmitReview}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full px-6 py-6 text-left space-y-4"
            id="review-entry-form"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">대여 농기계 솔직담백 리뷰</h3>
              <button
                type="button"
                onClick={() => setReviewingBooking(null)}
                className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Stars rating select */}
            <div className="space-y-1 text-center">
              <label className="block text-xs font-semibold text-slate-500 mb-1">장비 운영성 및 신뢰도 평점</label>
              <div className="flex items-center justify-center space-x-1.5" id="stars-row-select">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= rating ? "fill-amber-400 text-amber-500" : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Critique content */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">상세 대여 경험 공유</label>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="인수 인계 상황이나 기계 가동 결함, 소유주의 친절도 등을 자유롭게 서술해 이웃 농민들을 도와주세요."
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2.5 h-24 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={reviewProcessing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:bg-slate-350"
            >
              {reviewProcessing ? "리뷰 업로드 중..." : "리뷰 작성 끝마치기"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
