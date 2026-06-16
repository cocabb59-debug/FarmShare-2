import React, { useState } from "react";
import { useApp } from "./context/AppContext";
import { Navbar } from "./components/Navbar";
import { RegisterModal } from "./components/RegisterModal";
import { HomeView } from "./components/HomeView";
import { FindView } from "./components/FindView";
import { BookingsView } from "./components/BookingsView";
import { ChatsView } from "./components/ChatsView";
import { RegisterView } from "./components/RegisterView";
import { FAQBot } from "./components/FAQBot";
import { AdminView } from "./components/AdminView";
import { MachineDetailModal } from "./components/MachineDetailModal";
import { MachineFormModal } from "./components/MachineFormModal";
import { AuthErrorModal } from "./components/AuthErrorModal";
import { Machine, Role } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { Tractor, PlusCircle, HelpCircle } from "lucide-react";

export default function App() {
  const { isProfileRequired, userProfile, authLoading, authError } = useApp();

  // Navigation states
  const [activeTab, setActiveTab] = useState<string>("home");

  // Filter transport states
  const [overrideCategory, setOverrideCategory] = useState("");
  const [overrideRegion, setOverrideRegion] = useState("");

  // Modal active states
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isRegisteringMachine, setIsRegisteringMachine] = useState(false);

  // Dispatch search parameters from Home banner to catalog search
  const handleHomeSearchDispatch = (searchParams: { category: string; region: string }) => {
    setOverrideCategory(searchParams.category);
    setOverrideRegion(searchParams.region);
    setActiveTab("find");
  };

  // Safe navigation tab picker
  const handleNavigateToTab = (tabId: string) => {
    setActiveTab(tabId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3" id="app-loading-state">
        <Tractor className="h-10 w-10 text-emerald-500 animate-bounce" />
        <p className="text-sm font-bold text-slate-800">농기계 공유마켓 불러오는 중...</p>
      </div>
    );
  }

  // Render current active tab content
  const renderActiveView = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeView
            onSearchDispatch={handleHomeSearchDispatch}
            onSelectMachine={setSelectedMachine}
            onNavigateToTab={handleNavigateToTab}
          />
        );
      case "find":
        return (
          <FindView
            onSelectMachine={setSelectedMachine}
            overrideCategory={overrideCategory}
            overrideRegion={overrideRegion}
          />
        );
      case "bookings":
        return <BookingsView />;
      case "chats":
        return <ChatsView />;
      case "register":
        return <RegisterView />;
      case "support":
        return <FAQBot />;
      case "admin":
        return <AdminView />;
      default:
        return <HomeView onSearchDispatch={handleHomeSearchDispatch} onSelectMachine={setSelectedMachine} onNavigateToTab={handleNavigateToTab} />;
    }
  };

  const isOwner = userProfile && userProfile.role === Role.OWNER;

  return (
    <div className="min-h-screen bg-white flex flex-col select-none relative" id="app-viewport">
      {/* 1. Header bar navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main content container wraps with slight motion transition */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Global Footer copyright lines */}
      <footer className="bg-slate-50 border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-700">농기계 공유마켓 (Farm Rental Platform)</p>
          <p>© 2026 농기계 공유마켓 Inc. All Rights Reserved. 안심 결제 보증보험 탑재 및 우범 신고 연동</p>
        </div>
      </footer>

      {/* 4. Overlay Modals */}
      <AnimatePresence>
        {/* Force profile registration for new users */}
        {isProfileRequired && <RegisterModal />}

        {/* Detailed specifications inspect popup */}
        {selectedMachine && (
          <MachineDetailModal
            machine={selectedMachine}
            onClose={() => setSelectedMachine(null)}
            onNavigateToTab={handleNavigateToTab}
          />
        )}

        {/* Agricultural machine registration form popup */}
        {isRegisteringMachine && (
          <MachineFormModal onClose={() => setIsRegisteringMachine(false)} />
        )}

        {/* Auth Whitelist Security Domain guide helper popup */}
        {authError && <AuthErrorModal />}
      </AnimatePresence>

      {/* 5. Floating action utility buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-40" id="floating-actions-layer">
        {/* Owner's Quick Add button */}
        {isOwner && activeTab === "find" && (
          <button
            onClick={() => setIsRegisteringMachine(true)}
            id="floating-add-machine-btn"
            className="h-12 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer transition-transform hover:scale-105"
            title="장비 임출 등록"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="text-xs font-bold">새 농기계 등록</span>
          </button>
        )}

        {/* Floating Quick FAQ drawer activator */}
        {activeTab !== "support" && (
          <button
            onClick={() => setActiveTab("support")}
            id="floating-support-btn"
            className="h-12 w-12 bg-slate-800 hover:bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg shadow-slate-800/10 cursor-pointer transition-transform hover:scale-105"
            title="AI 고객 비서"
          >
            <HelpCircle className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
