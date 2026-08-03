// Tambahkan 'Leaf' di import lucide-react di bagian atas Header.tsx:
import {
  // ...
  Sparkles,
  Palette,
  Leaf,
} from 'lucide-react';

// Dan perbarui interface HeaderProps & render dropdown-nya:
interface HeaderProps {
  // ...
  theme?: 'light' | 'dark' | 'pink' | 'purple' | 'green';
  setTheme?: (val: 'light' | 'dark' | 'pink' | 'purple' | 'green') => void;
}

// Di bagian tombol toggle theme di dalam return JSX:
<button
  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all flex items-center justify-center text-xs font-bold cursor-pointer"
  title="Pilih Tema"
>
  {theme === 'green' ? (
    <Leaf className="w-5 h-5 text-emerald-600" />
  ) : theme === 'purple' ? (
    <Palette className="w-5 h-5 text-purple-500" />
  ) : theme === 'pink' ? (
    <Sparkles className="w-5 h-5 text-pink-500" />
  ) : theme === 'dark' ? (
    <Moon className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
  ) : (
    <Sun className="w-5 h-5 text-amber-400" />
  )}
</button>

{/* Pilihan di dalam dropdown menu */}
{isThemeDropdownOpen && (
  <>
    <div 
      className="fixed inset-0 z-40" 
      onClick={() => setIsThemeDropdownOpen(false)}
    />
    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
      <button
        onClick={() => { setTheme('light'); setIsThemeDropdownOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all rounded-t-2xl ${
          theme === 'light' ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-zinc-800/50' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
        }`}
      >
        <Sun className="w-4 h-4 text-amber-400" />
        <span>Terang</span>
      </button>
      <button
        onClick={() => { setTheme('dark'); setIsThemeDropdownOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
          theme === 'dark' ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-zinc-800/50' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
        }`}
      >
        <Moon className="w-4 h-4 text-indigo-400" />
        <span>Gelap</span>
      </button>
      <button
        onClick={() => { setTheme('pink'); setIsThemeDropdownOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
          theme === 'pink' ? 'text-pink-600 bg-pink-50' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
        }`}
      >
        <Sparkles className="w-4 h-4 text-pink-500" />
        <span>Pink Mode</span>
      </button>
      <button
        onClick={() => { setTheme('purple'); setIsThemeDropdownOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
          theme === 'purple' ? 'text-purple-600 bg-purple-50' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
        }`}
      >
        <Palette className="w-4 h-4 text-purple-500" />
        <span>Purple Mode</span>
      </button>
      <button
        onClick={() => { setTheme('green'); setIsThemeDropdownOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all rounded-b-2xl ${
          theme === 'green' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
        }`}
      >
        <Leaf className="w-4 h-4 text-emerald-600" />
        <span>Matcha Mode</span>
      </button>
    </div>
  </>
)}