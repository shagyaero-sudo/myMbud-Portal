import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Users,
  FolderKanban,
  FileText,
  Dices,
  Calculator,
  ChevronRight,
  FileEdit,
  Globe,
  Handshake,
  BookOpenCheck,
  Gamepad2,
  LayoutGrid,
  X,
  Award,
  GraduationCap,
  ClipboardList,
  FileSpreadsheet,
  Sun,
  Moon,
  type LucideIcon
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'contacts'
  | 'materials'
  | 'tasks'
  | 'spinwheel'
  | 'calculator'
  | 'letter'
  | 'mbudiary'
  | 'blockblast';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeTaskCount: number;
  onOpenGpaModal: () => void;
}

type MenuItem =
  | {
      id: TabType;
      label: string;
      icon: LucideIcon;
      count: number | null;
      isModal?: false;
    }
  | {
      id: string;
      label: string;
      icon: LucideIcon;
      count: number | null;
      isModal: true;
      action: () => void;
    };

interface BottomTabItemProps {
  id: TabType;
  label: string;
  icon: LucideIcon;
  activeTab: TabType;
  onClick: (id: TabType) => void;
  count?: number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeTaskCount,
  onOpenGpaModal
}) => {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = localStorage.getItem('mymbud_user_name') || 'Mbuders';

    if (hour >= 4 && hour < 11) return `Selamat Pagi, ${userName}!`;
    if (hour >= 11 && hour < 15) return `Selamat Siang, ${userName}!`;
    if (hour >= 15 && hour < 18) return `Selamat Sore, ${userName}!`;

    return `Selamat Malam, ${userName}!`;
  };

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 15) {
      return <Sun className="w-4 h-4 text-amber-500" />;
    }
    if (hour >= 15 && hour < 18) {
      return <Sun className="w-4 h-4 text-orange-500" />;
    }
    return <Moon className="w-4 h-4 text-indigo-400" />;
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Jadwal Perkuliahan',
      icon: CalendarDays,
      count: null
    },
    {
      id: 'tasks',
      label: 'Manajemen Tugas',
      icon: FolderKanban,
      count: activeTaskCount > 0 ? activeTaskCount : null
    },
    {
      id: 'contacts',
      label: 'Direktori Kontak',
      icon: Users,
      count: null
    },
    {
      id: 'materials',
      label: 'Bank Materi PDF',
      icon: FileText,
      count: null
    },
    {
      id: 'spinwheel',
      label: 'Spinwheel',
      icon: Dices,
      count: null
    },
    {
      id: 'calculator',
      label: 'Kalkulator Nilai',
      icon: Calculator,
      count: null
    },
    {
      id: 'letter',
      label: 'Ajukan Surat Turlap',
      icon: FileEdit,
      count: null
    },
    {
      id: 'gpacalculator',
      label: 'Hitung IP Semester',
      icon: Award,
      count: null,
      isModal: true,
      action: onOpenGpaModal
    }
  ];

  const navigateFromSheet = (tab: TabType) => {
    setActiveTab(tab);
    setIsBottomSheetOpen(false);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR (AUTO-EXPANDING HOVER + FROSTED GLASS) */}
      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ width: isHovered ? 260 : 76 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="hidden lg:flex flex-col bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-3.5 text-slate-700 dark:text-zinc-200 min-h-[calc(100vh-80px)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none shrink-0 my-2 transition-colors overflow-hidden select-none z-20"
      >
        {/* Header Greeting / Time Icon */}
        <div className="hidden lg:block mb-4 px-2 py-1 transition-all overflow-hidden h-12">
          {isHovered ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight truncate">
                {getGreeting()}
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight truncate">
                Siap untuk produktif hari ini?
              </p>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-1.5 rounded-xl bg-white/60 dark:bg-zinc-800/60 border border-slate-200/50 dark:border-white/5 shadow-xs flex items-center justify-center"
                title={getGreeting()}
              >
                {getTimeIcon()}
              </motion.div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav aria-label="Sidebar Navigation" className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden pr-0.5 pb-4 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = !item.isModal && activeTab === item.id;

            return (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                key={item.id}
                title={!isHovered ? item.label : undefined}
                onClick={() => {
                  if (item.isModal) {
                    item.action();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`relative w-full flex items-center h-11 px-3 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarBg"
                    className="absolute inset-0 bg-blue-50/80 dark:bg-blue-950/60 rounded-2xl shadow-xs border border-blue-100/50 dark:border-blue-900/40"
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 30
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-center shrink-0 w-6">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 scale-105'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  />
                </div>

                {/* Expanding Label */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="relative z-10 flex items-center justify-between flex-1 min-w-0 pl-3 overflow-hidden"
                    >
                      <span className="truncate whitespace-nowrap">{item.label}</span>

                      {item.count !== null ? (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1.5 shrink-0 ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-rose-500 text-white shadow-xs'
                          }`}
                        >
                          {item.count}
                        </span>
                      ) : (
                        isActive && (
                          <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dot Badge saat Collapsed */}
                {!isHovered && item.count !== null && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 z-20" />
                )}
              </motion.button>
            );
          })}

          {/* Desktop Sidebar: myITS Academics 2.0 */}
          <div className="pt-3 mt-3 border-t border-slate-200/50 dark:border-white/5 space-y-1">
            {isHovered && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 tracking-wider px-2 mb-1 truncate"
              >
                <span className="lowercase">my</span>ITS ACADEMICS 2.0
              </motion.p>
            )}

            <a
              href="https://mia.its.ac.id/presensi/"
              target="_blank"
              rel="noreferrer"
              title={!isHovered ? 'Presensi' : undefined}
              className="flex items-center h-10 px-3 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-zinc-800/50 transition-all"
            >
              <div className="flex items-center justify-center shrink-0 w-6">
                <ClipboardList className="w-4 h-4" />
              </div>
              {isHovered && <span className="pl-3 truncate">Presensi</span>}
            </a>

            <a
              href="https://mia.its.ac.id/rencana-studi/"
              target="_blank"
              rel="noreferrer"
              title={!isHovered ? 'Rencana Studi (FRS)' : undefined}
              className="flex items-center h-10 px-3 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-zinc-800/50 transition-all"
            >
              <div className="flex items-center justify-center shrink-0 w-6">
                <GraduationCap className="w-4 h-4" />
              </div>
              {isHovered && <span className="pl-3 truncate">Rencana Studi (FRS)</span>}
            </a>

            <a
              href="https://mia.its.ac.id/penilaian/"
              target="_blank"
              rel="noreferrer"
              title={!isHovered ? 'Transkrip Nilai' : undefined}
              className="flex items-center h-10 px-3 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-zinc-800/50 transition-all"
            >
              <div className="flex items-center justify-center shrink-0 w-6">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              {isHovered && <span className="pl-3 truncate">Transkrip Nilai</span>}
            </a>
          </div>

          {/* Desktop Sidebar: External Links */}
          <div className="pt-3 mt-2 border-t border-slate-200/50 dark:border-white/5 space-y-1">
            {isHovered && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-1 truncate"
              >
                Portal Akademik (Lama)
              </motion.p>
            )}

            <a
              href="https://akademik.its.ac.id/home.php"
              target="_blank"
              rel="noreferrer"
              title={!isHovered ? 'myITS SIAKAD' : undefined}
              className="flex items-center h-10 px-3 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-zinc-800/50 transition-all"
            >
              <div className="flex items-center justify-center shrink-0 w-6">
                <Globe className="w-4 h-4" />
              </div>
              {isHovered && <span className="pl-3 truncate">myITS SIAKAD</span>}
            </a>

            <a
              href="https://kemahasiswaan.its.ac.id/beranda"
              target="_blank"
              rel="noreferrer"
              title={!isHovered ? 'myITS StudentConnect' : undefined}
              className="flex items-center h-10 px-3 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-zinc-800/50 transition-all"
            >
              <div className="flex items-center justify-center shrink-0 w-6">
                <Handshake className="w-4 h-4" />
              </div>
              {isHovered && <span className="pl-3 truncate">StudentConnect</span>}
            </a>

            <a
              href="https://classroom.its.ac.id/auth/oidc"
              target="_blank"
              rel="noreferrer"
              title={!isHovered ? 'myITS Classroom' : undefined}
              className="flex items-center h-10 px-3 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-zinc-800/50 transition-all"
            >
              <div className="flex items-center justify-center shrink-0 w-6">
                <BookOpenCheck className="w-4 h-4" />
              </div>
              {isHovered && <span className="pl-3 truncate">myITS Classroom</span>}
            </a>
          </div>

          {/* Desktop Sidebar: Minigame */}
          <div className="pt-3 mt-2 border-t border-slate-200/50 dark:border-white/5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              title={!isHovered ? 'myMbudblox' : undefined}
              onClick={() => setActiveTab('blockblast')}
              className={`group relative w-full overflow-hidden rounded-2xl p-2.5 text-xs font-bold transition-all border ${
                activeTab === 'blockblast'
                  ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white border-transparent shadow-lg shadow-purple-500/30'
                  : 'bg-gradient-to-r from-purple-50/80 via-fuchsia-50/80 to-pink-50/80 dark:from-purple-950/40 dark:via-fuchsia-950/30 dark:to-pink-950/30 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40 hover:shadow-md hover:shadow-purple-500/10'
              }`}
            >
              <div className="relative flex items-center">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'blockblast'
                      ? 'bg-white/20'
                      : 'bg-white/80 dark:bg-zinc-900/80 shadow-xs'
                  }`}
                >
                  <Gamepad2
                    className={`w-4 h-4 ${
                      activeTab === 'blockblast'
                        ? 'text-white'
                        : 'text-purple-500'
                    }`}
                  />
                </div>

                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center justify-between flex-1 min-w-0 pl-3"
                  >
                    <span className="truncate">myMbudblox</span>
                    <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          </div>
        </nav>

        {/* Footer Brand */}
        <div className="mt-2 pt-3 border-t border-slate-200/50 dark:border-white/5 px-2 text-xs text-slate-400 dark:text-zinc-500 shrink-0 h-10 flex items-center overflow-hidden">
          {isHovered ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="truncate"
            >
              <p className="font-bold text-slate-600 dark:text-zinc-300 truncate">
                <span className="font-light">my</span>Mbud
                <span className="font-light"> Portal</span>
              </p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                by AER046
              </p>
            </motion.div>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 text-center w-full">v2.5</span>
          )}
        </div>
      </motion.aside>

      {/* MOBILE/TABLET FLOATING GLASS NAVIGATION BAR */}
      <div className="lg:hidden fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-6 sm:right-6 z-40 max-w-md mx-auto pointer-events-none">
        <nav 
          aria-label="Mobile Navigation" 
          className="pointer-events-auto w-full h-[66px] bg-white/70 dark:bg-zinc-950/65 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 dark:border-white/15 rounded-3xl sm:rounded-[32px] px-2.5 sm:px-4 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] relative"
        >
          <BottomTabItem
            id="dashboard"
            label="Jadwal"
            icon={CalendarDays}
            activeTab={activeTab}
            onClick={setActiveTab}
          />

          <BottomTabItem
            id="tasks"
            label="Tugas"
            icon={FolderKanban}
            activeTab={activeTab}
            onClick={setActiveTab}
            count={activeTaskCount > 0 ? activeTaskCount : null}
          />

          {/* TOMBOL MENU TENGAH FLOATING */}
          <div className="relative flex flex-col items-center justify-center -top-2.5 px-1 shrink-0">
            <div className="p-1 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/30">
              <motion.button
                type="button"
                aria-label="Buka menu navigasi"
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsBottomSheetOpen(true)}
                className="w-10 h-10 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/30 transition-transform cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4" />
              </motion.button>
            </div>
            <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
              Menu
            </span>
          </div>

          <BottomTabItem
            id="contacts"
            label="Kontak"
            icon={Users}
            activeTab={activeTab}
            onClick={setActiveTab}
          />

          <BottomTabItem
            id="materials"
            label="Materi"
            icon={FileText}
            activeTab={activeTab}
            onClick={setActiveTab}
          />
        </nav>
      </div>

      {/* MOBILE BOTTOM SHEET (GLASSMORPHISM) */}
      <AnimatePresence>
        {isBottomSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBottomSheetOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 26,
                stiffness: 300
              }}
              className="fixed bottom-0 left-0 right-0 z-50 h-[80vh] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl rounded-t-3xl shadow-2xl flex flex-col lg:hidden border-t border-white/60 dark:border-white/10"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200/40 dark:border-white/10 shrink-0">
                <div className="w-8" />
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />

                <button
                  type="button"
                  aria-label="Tutup sheet"
                  onClick={() => setIsBottomSheetOpen(false)}
                  className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20 custom-scrollbar">
                {/* 1. myITS Academics 2.0 */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 tracking-wider px-1">
                    <span className="lowercase">my</span>ITS ACADEMICS 2.0
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <a
                      href="https://mia.its.ac.id/presensi/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white/60 dark:bg-zinc-800/50 border border-slate-200/40 dark:border-white/5 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <ClipboardList className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">Presensi</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>

                    <a
                      href="https://mia.its.ac.id/rencana-studi/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white/60 dark:bg-zinc-800/50 border border-slate-200/40 dark:border-white/5 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">Rencana Studi (FRS)</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>

                    <a
                      href="https://mia.its.ac.id/penilaian/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white/60 dark:bg-zinc-800/50 border border-slate-200/40 dark:border-white/5 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">Transkrip Nilai</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* 2. PORTAL myITS (LAMA) */}
                <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                    PORTAL myITS (LAMA)
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 w-full">
                    <a
                      href="https://akademik.its.ac.id/home.php"
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2 rounded-2xl bg-white/60 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 active:scale-95 transition-all text-[11px] font-semibold text-center border border-slate-200/40 dark:border-white/5"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">SIAKAD 1.0</span>
                    </a>

                    <a
                      href="https://classroom.its.ac.id/auth/oidc"
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2 rounded-2xl bg-white/60 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 active:scale-95 transition-all text-[11px] font-semibold text-center border border-slate-200/40 dark:border-white/5"
                    >
                      <BookOpenCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">Classroom</span>
                    </a>

                    <a
                      href="https://kemahasiswaan.its.ac.id/beranda"
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2 rounded-2xl bg-white/60 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 active:scale-95 transition-all text-[11px] font-semibold text-center border border-slate-200/40 dark:border-white/5"
                    >
                      <Handshake className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">StudentConnect</span>
                    </a>
                  </div>
                </div>

                {/* 3. TOOLS LAINNYA */}
                <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                    TOOLS LAINNYA
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => navigateFromSheet('spinwheel')}
                      className="flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 active:bg-blue-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Dices className="w-4 h-4 shrink-0" />
                        <span className="truncate">Spinwheel</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateFromSheet('calculator')}
                      className="flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 active:bg-indigo-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Calculator className="w-4 h-4 shrink-0" />
                        <span className="truncate">Kalkulator Nilai</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateFromSheet('letter')}
                      className="flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 active:bg-emerald-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileEdit className="w-4 h-4 shrink-0" />
                        <span className="truncate">Ajukan Surat Turlap</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsBottomSheetOpen(false);
                        onOpenGpaModal();
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 active:bg-amber-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Award className="w-4 h-4 shrink-0" />
                        <span className="truncate">Hitung IP Semester</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* 4. MINIGAME */}
                <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                    MINIGAME
                  </p>

                  <button
                    type="button"
                    onClick={() => navigateFromSheet('blockblast')}
                    className="group relative w-full overflow-hidden rounded-2xl p-3 text-xs font-bold transition-all border bg-gradient-to-r from-purple-50/80 via-fuchsia-50/80 to-pink-50/80 dark:from-purple-950/40 dark:via-fuchsia-950/30 dark:to-pink-950/30 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/50 active:scale-95"
                  >
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 shadow-xs">
                          <Gamepad2 className="w-5 h-5 text-purple-500" />
                        </div>

                        <div className="text-left">
                          <span>myMbudblox</span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* HELPER COMPONENT BOTTOM TAB */
const BottomTabItem: React.FC<BottomTabItemProps> = ({
  id,
  label,
  icon: Icon,
  activeTab,
  onClick,
  count
}) => {
  const isActive = activeTab === id;

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`relative flex flex-col items-center justify-center flex-1 max-w-[64px] h-full transition-all cursor-pointer select-none ${
        isActive
          ? 'text-blue-600 dark:text-blue-400 font-bold'
          : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <Icon
          className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${
            isActive ? 'scale-110' : ''
          }`}
        />
        {count ? (
          <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] font-extrabold px-1 py-0.1 rounded-full flex items-center justify-center min-w-[0.9rem] h-3.5 shadow-xs">
            {count}
          </span>
        ) : null}
      </div>

      <span className="text-[9px] tracking-tight leading-none">
        {label}
      </span>
    </button>
  );
};