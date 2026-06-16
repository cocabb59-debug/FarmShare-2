import React from "react";
import { useApp } from "../context/AppContext";
import { Role } from "../types";
import {
  Tractor,
  User,
  LogOut,
  Calendar,
  MessageSquare,
  HelpCircle,
  ShieldAlert,
  Search,
  PlusCircle,
  Menu,
  X,
  RefreshCw
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, userProfile, login, logout, changeRole, authLoading } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: "home", label: "홈", icon: Tractor },
    { id: "find", label: "농기계 찾기", icon: Search },
    { id: "register", label: "대여해주기 (장비등록)", icon: PlusCircle, authOnly: true },
    { id: "bookings", label: "내 예약", icon: Calendar, authOnly: true },
    { id: "chats", label: "채팅", icon: MessageSquare, authOnly: true },
    { id: "support", label: "고객센터 (AI)", icon: HelpCircle },
    { id: "admin", label: "관리자", icon: ShieldAlert, adminOnly: true },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const isItemVisible = (item: any) => {
    if (item.authOnly && !currentUser) return false;
    if (item.ownerOnly && (!currentUser || !userProfile || userProfile.role !== Role.OWNER)) return false;
    if (item.adminOnly && (!currentUser || !userProfile || userProfile.role !== Role.ADMIN)) return false;
    return true;
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-xs" id="nav-master">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick("home")}
              className="flex items-center space-x-2 text-emerald-600 font-bold text-xl tracking-tight cursor-pointer"
              id="logo-brand-btn"
            >
              <Tractor className="h-7 w-7 text-emerald-500" />
              <span className="text-slate-900">농기계</span>
              <span className="text-emerald-500">공유마켓</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navItems.map((item) => {
                if (!isItemVisible(item)) return null;
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer space-x-1 ${
                      isActive
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Sign-In Info / Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {authLoading ? (
              <div className="animate-pulse h-8 w-24 bg-slate-100 rounded-full"></div>
            ) : currentUser ? (
              <div className="flex items-center space-x-3">
                {/* Role switcher switch (Convenient toggler for multi-profile testing!) */}
                {userProfile && (
                  <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200 text-xs">
                    <span className="px-2 font-semibold text-slate-500">신분:</span>
                    <select
                      id="navbar-role-select"
                      value={userProfile.role}
                      onChange={(e) => changeRole(e.target.value as Role)}
                      className="bg-transparent text-slate-800 font-medium border-none outline-none pr-1 cursor-pointer focus:ring-0"
                    >
                      <option value={Role.USER}>🧑🌾 일반농민</option>
                      <option value={Role.OWNER}>🚜 대여소유자</option>
                      <option value={Role.ADMIN}>🛡️ 관리자</option>
                    </select>
                  </div>
                )}

                {/* Profile Badge */}
                <div className="flex items-center space-x-2 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs ring-1 ring-emerald-300">
                    {userProfile?.name?.charAt(0) || currentUser.displayName?.charAt(0) || "농"}
                  </div>
                  <span className="text-sm font-medium pr-1">
                    {userProfile?.name || currentUser.displayName || "농가회원"}님
                  </span>
                </div>

                {/* LogOut Action */}
                <button
                  onClick={logout}
                  id="nav-logout-btn"
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors tooltip cursor-pointer"
                  title="로그아웃"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                id="nav-login-btn"
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <User className="h-4 w-4" />
                <span>Google로 간편로그인</span>
              </button>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-500 hover:text-slate-800 focus:outline-hidden cursor-pointer"
              aria-label="Toggle navigation menu"
              id="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 py-3 px-4 space-y-1 block shadow-lg">
          {navItems.map((item) => {
            if (!isItemVisible(item)) return null;
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors cursor-pointer space-x-2 ${
                  isActive
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-emerald-50/20"
                }`}
              >
                <IconComponent className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="border-t border-slate-100 pt-4 pb-2 mt-4">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                      {userProfile?.name?.charAt(0) || "농"}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-800">
                        {userProfile?.name || currentUser.displayName}님
                      </p>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                {userProfile && (
                  <div className="px-4">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      신분 전환
                    </label>
                    <select
                      value={userProfile.role}
                      onChange={(e) => changeRole(e.target.value as Role)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-semibold text-slate-800"
                    >
                      <option value={Role.USER}>🧑🌾 일반농민 (대여수요)</option>
                      <option value={Role.OWNER}>🚜 대여소유자 (장비등록)</option>
                      <option value={Role.ADMIN}>🛡️ 관리자</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md space-x-2 cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  login();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                <User className="h-5 w-5 mr-2" />
                <span>Google로 간편로그인</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
