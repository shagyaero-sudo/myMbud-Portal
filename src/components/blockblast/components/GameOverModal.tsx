import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Flame, Sparkles } from 'lucide-react';
import { GameStats } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  isNewHighScore: boolean;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewHighScore,
  onRestart,
}) => {
  useEffect(() => {
    if (isNewHighScore) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isNewHighScore]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-black flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Top Glow Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500"></div>

        {/* Header Badge */}
        <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-3 shadow-inner">
          {isNewHighScore ? (
            <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
          ) : (
            <Sparkles className="w-8 h-8 text-zinc-300" />
          )}
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white uppercase">
          {isNewHighScore ? 'REKOR BARU!' : 'PERMAINAN SELESAI'}
        </h2>
        <p className="text-xs font-semibold text-zinc-400 mt-0.5 mb-5">
          {isNewHighScore ? 'Pencapaian yang sangat luar biasa!' : 'Tidak ada ruang lagi untuk memasang balok.'}
        </p>

        {/* Stats Grid */}
        <div className="w-full bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800/80 space-y-3 mb-6">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">Skor Akhir</span>
            <span className="text-2xl font-black text-cyan-300">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Skor Tertinggi
            </span>
            <span className="font-bold text-amber-300">{stats.highScore.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Beruntun Tertinggi
            </span>
            <span className="font-bold text-orange-400">x{stats.highestStreak}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Total Baris Dihapus</span>
            <span className="font-bold text-emerald-400">{stats.linesClearedTotal}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>MAIN LAGI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
