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
  FileSpreadsheet
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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeTaskCount,
  onOpenGpaModal
}) => {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName =
      localStorage.getItem('mymbud_user_name') || 'Mbuders';

    if (hour >= 4 && hour < 11) return `Selamat Pagi, ${userName}!`;
    if (hour >= 11 && hour < 15) return `Selamat Siang, ${userName}!`;
    if (hour >= 15 && hour < 18) return `Selamat Sore, ${userName}!`;

    return `Selamat Malam, ${userName}!`;
  };

  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Jadwal Perkuliahan',
      icon: CalendarDays,
      count: null,
      isModal: false
    },
    {
      id: 'tasks' as TabType,
      label: 'Manajemen Tugas',
      icon: FolderKanban,
      count: activeTaskCount > 0 ? activeTaskCount : null,
      isModal: false
    },
    {
      id: 'contacts' as TabType,
      label: 'Direktori Kontak',
      icon: Users,
      count: null,
      isModal: false
    },
    {
      id: 'materials' as TabType,
      label: 'Bank Materi PDF',
      icon: FileText,
      count: null,
      isModal: false
    },
    {
      id: 'spinwheel' as TabType,
      label: 'Spinwheel',
      icon: Dices,
      count: null,
      isModal: false
    },
    {
      id: 'calculator' as TabType,
      label: 'Kalkulator Nilai',
      icon: Calculator,
      count: null,
      isModal: false
    },
    {
      id: 'letter' as TabType,
      label: 'Ajukan Surat Turlap',
      icon: FileEdit,
      count: null,
      isModal: false
    },
    {
      id: 'gpacalculator' as any,
      label: 'Hitung IP Semester',
      icon: Award,
      count: null,
      isModal: true
    }
  ];

  const navigateFromSheet = (tab: TabType) => {
    setActiveTab(tab);
    setIsBottomSheetOpen(false);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-5 text-slate-700 dark:text-zinc-200 min-h-[calc(100vh-80px)] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] dark:shadow-none shrink-0 my-2 transition-colors">
        <div className="hidden lg:block mb-5 px-2 py-1 transition-all">
          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            {getGreeting()}
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Siap untuk produktif hari ini?
          </p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1 pb-4 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                whileTap={{ scale: 0.98 }}
                key={item.id}
                onClick={() => {
                  if (item.isModal) {
                    onOpenGpaModal();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`relative w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium transition-all ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarBg"
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-950/60 rounded-2xl shadow-xs"
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 30
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.count !== null ? (
                  <span
                    className={`relative z-10 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-rose-500 text-white shadow-xs'
                    }`}
                  >
                    {item.count}
                  </span>
                ) : (
                  isActive && (
                    <ChevronRight className="relative z-10 w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )
                )}
              </motion.button>
            );
          })}

          {/* Desktop Sidebar: myITS Academics 2.0 */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 tracking-wider px-2 mb-2">
              <span className="lowercase">my</span>ITS ACADEMICS 2.0
            </p>

            <a
              href="https://mia.its.ac.id/presensi/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Presensi</span>
            </a>

            <a
              href="https://mia.its.ac.id/rencana-studi/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Rencana Studi (FRS)</span>
            </a>

            <a
              href="https://mia.its.ac.id/penilaian/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Transkrip Nilai</span>
            </a>
          </div>

          {/* Desktop Sidebar: External Links */}
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-2">
              Portal Akademik (Lama)
            </p>

            <a
              href="https://akademik.its.ac.id/home.php"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all"
            >
              <Globe className="w-4 h-4" />
              <span>MyITS SIAKAD</span>
            </a>

            <a
              href="https://kemahasiswaan.its.ac.id/beranda"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all"
            >
              <Handshake className="w-4 h-4" />
              <span>myITS StudentConnect</span>
            </a>

            <a
              href="https://classroom.its.ac.id/auth/oidc"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all"
            >
              <BookOpenCheck className="w-4 h-4" />
              <span>myITS Classroom</span>
            </a>
          </div>

          {/* Desktop Sidebar: Minigame */}
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800">
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('blockblast')}
              className={`group relative w-full overflow-hidden rounded-2xl p-3 text-xs font-bold transition-all border ${
                activeTab === 'blockblast'
                  ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white border-transparent shadow-lg shadow-purple-500/30'
                  : 'bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950/40 dark:via-fuchsia-950/30 dark:to-pink-950/30 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/50 hover:shadow-md hover:shadow-purple-500/10'
              }`}
            >
              <div className="absolute -right-5 -top-5 w-16 h-16 rounded-full bg-purple-400/10 group-hover:bg-purple-400/20 transition-all" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      activeTab === 'blockblast'
                        ? 'bg-white/20'
                        : 'bg-white dark:bg-zinc-900 shadow-sm'
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

                  <div className="text-left">
                    <span>myMbudblox</span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.button>
          </div>
        </nav>

        <div className="mt-2 pt-4 border-t border-slate-100/60 dark:border-zinc-800 px-2 text-xs text-slate-400 dark:text-zinc-500 shrink-0">
          <p className="font-bold text-slate-600 dark:text-zinc-300">
            <span className="font-light">my</span>Mbud
            <span className="font-light"> Portal</span>
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            by AER046
          </p>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        <nav
          className="
            pointer-events-auto
            mx-3
            mb-[-12px]
            bg-white/80 dark:bg-zinc-900/85
            backdrop-blur-2xl
            border border-white/50 dark:border-white/10
            px-2
            pt-1.5
            pb-[calc(0.375rem+env(safe-area-inset-bottom))]
            flex items-center justify-between
            shadow-[0_8px_30px_rgb(0,0,0,0.12)]
            dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]
            rounded-[2rem]
            transition-colors
            relative
          "
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

          {/* TOMBOL MENU */}
          <div className="relative flex flex-col items-center justify-center -top-2.5 z-50">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsBottomSheetOpen(true)}
              className="
                w-[3.25rem]
                h-[3.25rem]
                bg-gradient-to-tr from-blue-600 to-indigo-500
                text-white
                rounded-full
                flex items-center justify-center
                shadow-lg shadow-indigo-500/30
                border-[4px] border-white/80 dark:border-zinc-900
                transition-colors
                focus:outline-none
              "
            >
              <LayoutGrid className="w-5 h-5" />
            </motion.button>

            <span className="absolute -bottom-4 text-[10px] font-bold text-slate-500 dark:text-zinc-400 tracking-tight">
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

      {/* MOBILE BOTTOM SHEET */}
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
              className="fixed bottom-0 left-0 right-0 z-50 h-[80vh] bg-white dark:bg-zinc-950 rounded-t-3xl shadow-2xl flex flex-col lg:hidden border-t border-slate-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                <div className="w-8" />
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />

                <button
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
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
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
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
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
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">Transkrip Nilai</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* 2. PORTAL AKADEMIK ITS */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                    PORTAL AKADEMIK (LAMA)
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="https://presensi.its.ac.id/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">myITS Presensi</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>

                    <a
                      href="https://classroom.its.ac.id/auth/oidc"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <BookOpenCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">myITS Classroom</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>

                    <a
                      href="https://akademik.its.ac.id/home.php"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">myITS SIAKAD</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>

                    <a
                      href="https://kemahasiswaan.its.ac.id/beranda"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Handshake className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">myITS StudConn</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* 3. TOOLS LAINNYA */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                    TOOLS LAINNYA
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
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
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                    MINIGAME
                  </p>

                  <button
                    onClick={() => navigateFromSheet('blockblast')}
                    className="group relative w-full overflow-hidden rounded-2xl p-3 text-xs font-bold transition-all border bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950/40 dark:via-fuchsia-950/30 dark:to-pink-950/30 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/50 active:scale-95"
                  >
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-900 shadow-sm">
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

/* HELPER COMPONENT UNTUK BOTTOM NAV BUTTONS */
const BottomTabItem = ({
  id,
  label,
  icon: Icon,
  activeTab,
  onClick,
  count
}: any) => {
  const isActive = activeTab === id;

  return (
    <button
      onClick={() => onClick(id)}
      className={`relative flex flex-col items-center justify-center w-16 py-1.5 rounded-2xl transition-all ${
        isActive
          ? 'text-blue-600 dark:text-blue-400 font-bold'
          : 'text-slate-500 dark:text-zinc-400'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeBottomTab"
          className="absolute inset-0 bg-white/80 dark:bg-zinc-800/80 rounded-2xl shadow-sm border border-slate-200/50 dark:border-zinc-700/50"
          transition={{
            type: 'spring',
            stiffness: 350,
            damping: 30
          }}
        />
      )}

      <Icon
        className={`relative z-10 w-5 h-5 mb-0.5 ${
          isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-400 dark:text-zinc-500'
        }`}
      />

      <span className="relative z-10 text-[10px] tracking-tight">
        {label}
      </span>

      {count ? (
        <span className="absolute -top-1 right-2 bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center justify-center min-w-[1.125rem] h-4 shadow-xs z-20">
          {count}
        </span>
      ) : null}
    </button>
  );
};