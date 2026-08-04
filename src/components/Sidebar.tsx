import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Dices,
  Calculator,
  ChevronRight,
  FileEdit,
} from 'lucide-react';

export type TabType = 'dashboard' | 'contacts' | 'materials' | 'tasks' | 'spinwheel' | 'calculator' | 'letter' | 'blockblast';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  urgentTaskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, urgentTaskCount }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi! 🌅';
    if (hour >= 11 && hour < 15) return 'Selamat Siang! ☀️';
    if (hour >= 15 && hour < 18) return 'Selamat Sore! 🌆';
    return 'Selamat Malam! 🌙';
  };

  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'tasks' as TabType,
      label: 'Manajemen Tugas',
      icon: FolderKanban,
      badge: urgentTaskCount > 0 ? urgentTaskCount : null,
    },
    {
      id: 'contacts' as TabType,
      label: 'Direktori Kontak',
      icon: Users,
      badge: null,
    },
    {
      id: 'materials' as TabType,
      label: 'Bank Materi PDF',
      icon: FileText,
      badge: null,
    },
    {
      id: 'spinwheel' as TabType,
      label: 'Spinwheel',
      icon: Dices,
      badge: null,
    },
    {
      id: 'calculator' as TabType,
      label: 'Kalkulator Nilai',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'letter' as TabType,
      label: 'Ajukan Surat Turlap',
      icon: FileEdit,
      badge: null,
    },
  ];

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-5 text-slate-700 dark:text-zinc-200 min-h-[calc(100vh-80px)] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] dark:shadow-none shrink-0 my-2 transition-colors">
        <div className="hidden lg:block mb-5 px-2 py-1 transition-all">
          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            {getGreeting()}
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Siap untuk produktif dan mengecek perkuliahan hari ini?!
          </p>
        </div>

        <nav className="flex-1 space-y-2">
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
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100/60 dark:border-zinc-800 px-2 text-xs text-slate-400 dark:text-zinc-500">
          <p className="font-bold text-slate-600 dark:text-zinc-300"><span className="font-light">my</span>Mbud<span className="font-light"> Portal</span></p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">by AER046</p>
        </div>
      </aside>

      {/* Mobile Floating Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none">
        <nav className="pointer-events-auto mx-4 mb-5 bg-white/70 dark:bg-zinc-900/75 backdrop-blur-2xl border border-white/50 dark:border-white/10 px-2.5 py-2.5 flex items-center justify-around shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-[2rem] transition-colors">
          {[
            { id: 'dashboard' as TabType, label: 'Menu', icon: LayoutDashboard },
            { id: 'tasks' as TabType, label: 'Tugas', icon: FolderKanban, badge: urgentTaskCount > 0 ? urgentTaskCount : null },
            { id: 'contacts' as TabType, label: 'Kontak', icon: Users },
            { id: 'materials' as TabType, label: 'Materi', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all ${
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
                <span className="relative z-10 text-[10px] tracking-tight">{item.label}</span>
                {item.badge ? (
                  <span className="absolute -top-1 -right-0.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs z-20">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};