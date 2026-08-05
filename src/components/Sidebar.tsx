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
  X
} from 'lucide-react';

export type TabType = 'dashboard' | 'contacts' | 'materials' | 'tasks' | 'spinwheel' | 'calculator' | 'letter' | 'blockblast';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  urgentTaskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, urgentTaskCount }) => {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi! 🌅';
    if (hour >= 11 && hour < 15) return 'Selamat Siang! ☀️';
    if (hour >= 15 && hour < 18) return 'Selamat Sore! 🌆';
    return 'Selamat Malam! 🌙';
  };

  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Jadwal Perkuliahan', icon: CalendarDays, badge: null },
    { id: 'tasks' as TabType, label: 'Manajemen Tugas', icon: FolderKanban, badge: urgentTaskCount > 0 ? urgentTaskCount : null },
    { id: 'contacts' as TabType, label: 'Direktori Kontak', icon: Users, badge: null },
    { id: 'materials' as TabType, label: 'Bank Materi PDF', icon: FileText, badge: null },
    { id: 'spinwheel' as TabType, label: 'Spinwheel', icon: Dices, badge: null },
    { id: 'calculator' as TabType, label: 'Kalkulator Nilai', icon: Calculator, badge: null },
    { id: 'letter' as TabType, label: 'Ajukan Surat Turlap', icon: FileEdit, badge: null },
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
            Siap untuk produktif dan mengecek perkuliahan hari ini?
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
                onClick={() => setActiveTab(item.id)}
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
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}>
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="relative z-10 w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </motion.button>
            );
          })}

          {/* Desktop Sidebar: External Links */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-2">Portal Akademik ITS</p>
            <a href="https://presensi.its.ac.id/dashboard" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all">
              <Globe className="w-4 h-4" /> <span>MyITS Presensi</span>
            </a>
            <a href="https://kemahasiswaan.its.ac.id/beranda" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all">
              <Handshake className="w-4 h-4" /> <span>StudentConnect</span>
            </a>
            <a href="https://classroom.its.ac.id/auth/oidc" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all">
              <BookOpenCheck className="w-4 h-4" /> <span>myITS Classroom</span>
            </a>
          </div>

          {/* Desktop Sidebar: Minigame */}
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800">
            <motion.button
              whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}
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
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'blockblast' ? 'bg-white/20' : 'bg-white dark:bg-zinc-900 shadow-sm'}`}>
                    <Gamepad2 className={`w-4 h-4 ${activeTab === 'blockblast' ? 'text-white' : 'text-purple-500'}`} />
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
          <p className="font-bold text-slate-600 dark:text-zinc-300"><span className="font-light">my</span>Mbud<span className="font-light"> Portal</span></p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">by AER046</p>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none">
        <nav className="pointer-events-auto mx-4 mb-5 bg-white/80 dark:bg-zinc-900/85 backdrop-blur-2xl border border-white/50 dark:border-white/10 px-2.5 py-2.5 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-[2rem] transition-colors relative">
          
          <BottomTabItem id="dashboard" label="Jadwal" icon={CalendarDays} activeTab={activeTab} onClick={setActiveTab} />
          <BottomTabItem id="tasks" label="Tugas" icon={FolderKanban} activeTab={activeTab} onClick={setActiveTab} badge={urgentTaskCount > 0 ? urgentTaskCount : null} />

          {/* TOMBOL SAKTI / APP DRAWER TRIGGER */}
          <div className="relative flex flex-col items-center justify-center -top-6 z-50">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsBottomSheetOpen(true)}
              className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 border-[4px] border-slate-50 dark:border-zinc-950 transition-colors focus:outline-none"
            >
              <LayoutGrid className="w-6 h-6" />
            </motion.button>
            <span className="absolute -bottom-5 text-[10px] font-bold text-slate-500 dark:text-zinc-400 tracking-tight">Menu</span>
          </div>

          <BottomTabItem id="contacts" label="Kontak" icon={Users} activeTab={activeTab} onClick={setActiveTab} />
          <BottomTabItem id="materials" label="Materi" icon={FileText} activeTab={activeTab} onClick={setActiveTab} />
        </nav>
      </div>

      {/* MOBILE BOTTOM SHEET (APP DRAWER) */}
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
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 h-[80vh] bg-white dark:bg-zinc-950 rounded-t-3xl shadow-2xl flex flex-col lg:hidden border-t border-slate-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                <div className="w-8" />
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                <button onClick={() => setIsBottomSheetOpen(false)} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20 custom-scrollbar">
                
                {/* PORTAL AKADEMIK ITS */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">PORTAL AKADEMIK ITS</p>
                  <a href="https://presensi.its.ac.id/dashboard" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold">
                    <span className="flex items-center gap-3"><Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" /> MyITS Presensi</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </a>
                  <a href="https://kemahasiswaan.its.ac.id/beranda" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold">
                    <span className="flex items-center gap-3"><Handshake className="w-4 h-4 text-blue-600 dark:text-blue-400" /> myITS StudentConnect</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </a>
                  <a href="https://classroom.its.ac.id/auth/oidc" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold">
                    <span className="flex items-center gap-3"><BookOpenCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> myITS Classroom</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </a>
                  <a href="https://akademik.its.ac.id/home.php" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 active:bg-slate-100 transition-all text-xs font-semibold">
                    <span className="flex items-center gap-3"><Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" /> myITS SIAKAD</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </a>
                </div>

                {/* TOOLS */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">TOOLS LAINNYA</p>
                  <button onClick={() => navigateFromSheet('spinwheel')} className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 active:bg-blue-100">
                    <div className="flex items-center gap-3"><Dices className="w-4 h-4" /><span>Spinwheel</span></div>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </button>
                  <button onClick={() => navigateFromSheet('calculator')} className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 active:bg-indigo-100">
                    <div className="flex items-center gap-3"><Calculator className="w-4 h-4" /><span>Kalkulator Nilai</span></div>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </button>
                  <button onClick={() => navigateFromSheet('letter')} className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 active:bg-emerald-100">
                    <div className="flex items-center gap-3"><FileEdit className="w-4 h-4" /><span>Ajukan Surat Turlap</span></div>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </button>
                </div>

                {/* MINIGAME */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">MINIGAME</p>
                  <button onClick={() => navigateFromSheet('blockblast')} className="group relative w-full overflow-hidden rounded-2xl p-3 text-xs font-bold transition-all border bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950/40 dark:via-fuchsia-950/30 dark:to-pink-950/30 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/50 active:scale-95">
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

/* --- HELPER COMPONENT UNTUK BOTTOM NAV BUTTONS --- */
const BottomTabItem = ({ id, label, icon: Icon, activeTab, onClick, badge }: any) => {
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`relative flex flex-col items-center justify-center w-16 py-1.5 rounded-2xl transition-all ${
        isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-zinc-400'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeBottomTab"
          className="absolute inset-0 bg-white/80 dark:bg-zinc-800/80 rounded-2xl shadow-sm border border-slate-200/50 dark:border-zinc-700/50"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <Icon className={`relative z-10 w-5 h-5 mb-0.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
      <span className="relative z-10 text-[10px] tracking-tight">{label}</span>
      {badge ? (
        <span className="absolute -top-1 right-2 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs z-20">
          {badge}
        </span>
      ) : null}
    </button>
  );
};