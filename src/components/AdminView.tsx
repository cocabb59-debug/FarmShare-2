import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { db } from "../lib/firebase";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Machine, Booking, Review, UserProfile, Role, MachineStatus } from "../types";
import { CATEGORIES } from "../lib/constants";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  ShieldAlert,
  Database,
  Users,
  Tractor,
  TrendingUp,
  CreditCard,
  Trash2,
  Lock,
  MessageSquare,
  AlertCircle
} from "lucide-react";

export const AdminView: React.FC = () => {
  const { userProfile, machines, reviews, deleteMachine, updateMachine } = useApp();

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  // Fetch administrator spreadsheets
  useEffect(() => {
    if (!userProfile || userProfile.role !== Role.ADMIN) {
      setLoading(false);
      return;
    }

    const fetchAdminData = async () => {
      setLoading(true);
      setErrorText("");
      try {
        // 1. Fetch Users
        const usersSnap = await getDocs(collection(db, "users"));
        const uItems: UserProfile[] = [];
        usersSnap.forEach((doc) => {
          uItems.push({ id: doc.id, ...doc.data() } as UserProfile);
        });
        setUsersList(uItems);

        // 2. Fetch Bookings
        const bookingsSnap = await getDocs(collection(db, "bookings"));
        const bItems: any[] = [];
        bookingsSnap.forEach((doc) => {
          bItems.push({ id: doc.id, ...doc.data() });
        });
        setAllBookings(bItems);

        // 3. Fetch Payments
        const paymentsSnap = await getDocs(collection(db, "payments"));
        const pItems: any[] = [];
        paymentsSnap.forEach((doc) => {
          pItems.push({ id: doc.id, ...doc.data() });
        });
        setAllPayments(pItems);
      } catch (err: any) {
        console.error("Admin spread fetch error:", err);
        setErrorText("관리자 데이터를 조회하는 중 권한 또는 스키마 검증에 실패했습니다: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [userProfile]);

  if (!userProfile || userProfile.role !== Role.ADMIN) {
    return (
      <div className="bg-slate-50 border border-slate-150 rounded-3xl py-16 text-center max-w-lg mx-auto my-8 p-6 space-y-3">
        <Lock className="h-12 w-12 text-amber-500 mx-auto animate-pulse" />
        <h3 className="font-extrabold text-slate-700 text-sm">관리자 계정 전용 승인 공간입니다</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          해당 탭의 스위치 로그는 임대 플랫폼 지배권을 가진 관리자에게만 오픈됩니다. <br />
          <span className="font-bold text-emerald-600">상단 헤더 네비게이션바의 [신분: 🛡️ 관리자] 목록 선택</span>을 통해 관리자 권한을 인가할 수 있습니다.
        </p>
      </div>
    );
  }

  // Statistics formulations
  const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalRented = machines.filter((m) => m.status === MachineStatus.RENTED).length;

  const chartData = [
    { name: "1월", 매출: Math.round(totalRevenue * 0.1) || 50000 },
    { name: "2월", 매출: Math.round(totalRevenue * 0.25) || 120000 },
    { name: "3월", 매출: Math.round(totalRevenue * 0.5) || 280000 },
    { name: "4월", 매출: Math.round(totalRevenue * 0.75) || 350000 },
    { name: "5월", 매출: totalRevenue || 450000 },
  ];

  const categoryDistribution = CATEGORIES.map((cat) => ({
    name: cat,
    수량: machines.filter((m) => m.category === cat).length,
  })).filter((c) => c.수량 > 0);

  const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#f59e0b", "#64748b"];

  const handleToggleUserRole = async (targetUid: string, currentRole: Role) => {
    const nextRole = currentRole === Role.ADMIN ? Role.USER : currentRole === Role.OWNER ? Role.ADMIN : Role.OWNER;
    try {
      await updateDoc(doc(db, "users", targetUid), { role: nextRole });
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUid ? { ...u, role: nextRole } : u))
      );
    } catch (err: any) {
      alert("역할 수정 실패: " + err.message);
    }
  };

  const handleDeleteMachineAudited = async (id: string) => {
    if (confirm("관리자 직권으로 해당 장치 리스팅을 정말 삭제하시겠습니까? (복구 불가능)")) {
      try {
        await deleteMachine(id);
      } catch (err: any) {
        alert("장비 삭제 실패: " + err.message);
      }
    }
  };

  const handleUpdateStatusAudited = async (id: string, currentStatus: MachineStatus) => {
    const targetStatus =
      currentStatus === MachineStatus.AVAILABLE
        ? MachineStatus.MAINTENANCE
        : currentStatus === MachineStatus.MAINTENANCE
        ? MachineStatus.RENTED
        : MachineStatus.AVAILABLE;
    try {
      await updateMachine(id, { status: targetStatus });
    } catch (err: any) {
      alert("상태 수정 실패: " + err.message);
    }
  };

  return (
    <div className="space-y-8 text-left" id="admin-view-root">
      {/* Page header */}
      <div className="pb-4 border-b border-slate-100 flex items-center space-x-3">
        <div className="h-10 w-10 bg-red-100/80 text-red-600 rounded-full flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">농기계 공유마켓 어드민 본부</h1>
          <p className="text-xs text-slate-400 mt-1">
            플랫폼 전체 가입자 정보, 장비 임대 실적 모니터링 및 리스크 관리 시스템을 총괄합니다.
          </p>
        </div>
      </div>

      {errorText && (
        <div className="bg-amber-50 text-amber-800 text-xs p-4 rounded-xl border border-amber-200 flex items-start space-x-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {/* KPI dashboard counters blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="admin-kpis">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">총 가입 회원</p>
            <p className="text-lg font-black text-slate-800">{usersList.length}명</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <Tractor className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">등록 농장비</p>
            <p className="text-lg font-black text-slate-800">{machines.length}대 ({totalRented}대 임대중)</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">수확 계약율</p>
            <p className="text-lg font-black text-slate-800">{allBookings.length}건 성립</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">플랫폼 총 매출</p>
            <p className="text-lg font-black text-slate-800">{(totalRevenue || 450000).toLocaleString()}원</p>
          </div>
        </div>
      </div>

      {/* Recharts statistical plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="admin-plots">
        {/* Plot A: Revenues */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl text-left space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">월별 세금 및 임대 매출 트랙</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} strokeWidth={0.5} />
                <YAxis stroke="#94a3b8" fontSize={11} strokeWidth={0.5} />
                <Tooltip />
                <Area type="monotone" dataKey="매출" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plot B: Categories distribute */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl text-left space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">농기계 분류 품목 보급 현황</h4>
          <div className="h-64 flex items-center justify-center">
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryDistribution}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} strokeWidth={0.5} />
                  <YAxis stroke="#94a3b8" fontSize={11} strokeWidth={0.5} />
                  <Tooltip />
                  <Bar dataKey="수량" fill="#10b981">
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-400 text-xs">보급 데이터 기록 없음</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Database Rows details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="admin-rows-grid">
        {/* users spreadsheets */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl">
          <h4 className="font-black text-slate-800 text-sm mb-4">가입 회원 가상 일람 표</h4>
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3">이름/이메일</th>
                  <th className="py-2.5 px-3">지역/번호</th>
                  <th className="py-2.5 px-3">신분</th>
                  <th className="py-2.5 px-3 text-center">할당 조정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p>{u.address}</p>
                      <p className="text-[10px] text-slate-400">{u.phone}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded-sm">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleUserRole(u.id, u.role)}
                        className="text-[10px] bg-slate-700 text-white font-bold py-1 px-2.2 rounded-md hover:bg-slate-800 cursor-pointer"
                      >
                        신분토글
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Machineries spreadsheet auditing */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl">
          <h4 className="font-black text-slate-800 text-sm mb-4">농장비 감사/조정 표</h4>
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3">기기명</th>
                  <th className="py-2.5 px-3">요금/지역</th>
                  <th className="py-2.5 px-3">상태</th>
                  <th className="py-2.5 px-3 text-center">위험삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {machines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{m.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {m.manufacturer} • {m.category}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold">{m.dailyPrice.toLocaleString()}원</p>
                      <p className="text-[10px] text-slate-400">{m.location}</p>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleUpdateStatusAudited(m.id, m.status)}
                        className="hover:scale-105 transition-transform text-[10px] border border-slate-150 px-2 py-0.5 rounded-sm cursor-pointer block font-semibold text-slate-700 bg-slate-50"
                      >
                        {m.status}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDeleteMachineAudited(m.id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
