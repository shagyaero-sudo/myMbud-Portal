import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, RefreshCw, Users, Sparkles, X, RotateCcw, Trophy, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { defaultStudentsList } from '../data/mockData';
import { GroupResult } from '../types';

interface SpinwheelViewProps {
  onSaveGroupResult: (result: Omit<GroupResult, 'id' | 'createdAt'>) => void;
  savedResults: GroupResult[];
  isOfficer?: boolean;
}

export const SpinwheelView: React.FC<SpinwheelViewProps> = ({ onSaveGroupResult, savedResults, isOfficer = false }) => {
  const [studentsText, setStudentsText] = useState(defaultStudentsList.join('\n'));
  const [groupMode, setGroupMode] = useState<'COUNT' | 'SIZE'>('COUNT');
  const [groupValue, setGroupValue] = useState<number>(4);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<'ANIMATION' | 'RESULT'>('ANIMATION');
  const [spinMode, setSpinMode] = useState<'GROUPS' | 'INDIVIDUAL'>('GROUPS');
  const [selectedIndividual, setSelectedIndividual] = useState<string | null>(null);
  const [groupResults, setGroupResults] = useState<{ name: string; members: string[] }[]>([]);
  const [rollingName, setRollingName] = useState<string>('');
  const [shuffleProgress, setShuffleProgress] = useState<number>(0);

  const studentList = studentsText
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  React.useEffect(() => {
    if (isModalOpen && modalStage === 'ANIMATION') {
      setShuffleProgress(0);
      const interval = setInterval(() => {
        if (studentList.length > 0) {
          const randomIndex = Math.floor(Math.random() * studentList.length);
          setRollingName(studentList[randomIndex]);
        }
        setShuffleProgress((prev) => Math.min(100, prev + 2.5));
      }, 70);

      return () => clearInterval(interval);
    }
  }, [isModalOpen, modalStage, studentList]);

  const generateGroupsInternal = () => {
    if (studentList.length === 0) return [];

    const shuffled = [...studentList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let numGroups = 4;
    if (groupMode === 'COUNT') {
      numGroups = Math.max(1, groupValue);
    } else {
      const perGroup = Math.max(1, groupValue);
      numGroups = Math.ceil(shuffled.length / perGroup);
    }

    const groupsArray: { name: string; members: string[] }[] = Array.from({ length: numGroups }, (_, i) => ({
      name: `Kelompok ${i + 1}`,
      members: [],
    }));

    shuffled.forEach((student, index) => {
      groupsArray[index % numGroups].members.push(student);
    });

    return groupsArray;
  };

  const handleStartSpin = () => {
    if (studentList.length === 0) return;

    setSpinMode('GROUPS');
    setIsModalOpen(true);
    setModalStage('ANIMATION');

    const newGroups = generateGroupsInternal();
    setGroupResults(newGroups);

    setTimeout(() => {
      setModalStage('RESULT');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }, 2800);
  };

  const handleStartIndividual = () => {
    if (studentList.length === 0) return;

    setSpinMode('INDIVIDUAL');
    setIsModalOpen(true);
    setModalStage('ANIMATION');

    const winner = studentList[Math.floor(Math.random() * studentList.length)];
    setSelectedIndividual(winner);

    setTimeout(() => {
      setModalStage('RESULT');
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
    }, 2800);
  };

  const handleReshuffle = () => {
    setModalStage('ANIMATION');

    if (spinMode === 'INDIVIDUAL') {
      const winner = studentList[Math.floor(Math.random() * studentList.length)];
      setSelectedIndividual(winner);
      setTimeout(() => {
        setModalStage('RESULT');
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
        });
      }, 2800);
    } else {
      const newGroups = generateGroupsInternal();
      setGroupResults(newGroups);
      setTimeout(() => {
        setModalStage('RESULT');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }, 2800);
    }
  };

  const getGridClass = (count: number) => {
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3';
    if (count <= 8) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-5 pb-12 w-full"
    >
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-4 sm:pt-6 pb-2">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-semibold mb-1 border border-blue-100/50 dark:border-blue-900/40">
            <Dices className="w-3.5 h-3.5" />
            <span>Spin The Wheel!</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight">Spinwheel Individu/Kelompok</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Sistem pengocokan nama secara acak dan transparan untuk kelompok atau individu.
          </p>
        </div>
      </div>

      {/* CARD UTAMA: FULL WIDTH & 2-COLUMN SPLIT */}
      <div className="w-full bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SISI KIRI: DAFTAR NAMA MAHASISWA */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/40 dark:border-white/5 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Daftar Anggota Kelas A ({studentList.length} Orang)</span>
              </h3>
              {isOfficer && (
                <button
                  onClick={() => setStudentsText(defaultStudentsList.join('\n'))}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Nama Mahasiswa (1 baris per nama):
              </label>
              <textarea
                rows={13}
                readOnly={!isOfficer}
                value={studentsText}
                onChange={(e) => setStudentsText(e.target.value)}
                placeholder="Ahmad Fauzi&#10;Budi Santoso&#10;Citra Dewi..."
                className={`w-full flex-1 p-4 rounded-2xl text-xs font-mono focus:outline-none transition-all resize-none ${
                  isOfficer
                    ? 'bg-white/60 dark:bg-zinc-800/70 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 shadow-xs'
                    : 'bg-white/40 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-800 cursor-not-allowed select-none'
                }`}
              />
            </div>
          </div>

          {/* SISI KANAN: METODE PEMBAGIAN & TOMBOL KOCOK */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            <div className="pb-2 border-b border-slate-200/40 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                Konfigurasi & Aksi Pengundian
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-white/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Metode Pembagian:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setGroupMode('COUNT')}
                  className={`p-3.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    groupMode === 'COUNT'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/80 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 border border-slate-200/50 dark:border-white/5'
                  }`}
                >
                  Berdasarkan Jumlah Kelompok
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setGroupMode('SIZE')}
                  className={`p-3.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    groupMode === 'SIZE'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/80 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 border border-slate-200/50 dark:border-white/5'
                  }`}
                >
                  Berdasarkan Jumlah Anggota
                </motion.button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">
                  {groupMode === 'COUNT' ? 'Target Jumlah Kelompok:' : 'Target Anggota per Kelompok:'}
                </span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={groupValue}
                  onChange={(e) => setGroupValue(parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 rounded-xl bg-white/80 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
                <span className="text-xs text-slate-600 dark:text-zinc-400">
                  {groupMode === 'COUNT' ? 'Kelompok' : 'Orang'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartSpin}
                disabled={studentList.length === 0}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mulai Acak Kelompok</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartIndividual}
                disabled={studentList.length === 0}
                className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>Acak 1 Orang (Individu)</span>
              </motion.button>
            </div>
          </div>

        </div>
      </div>

      {/* POP-UP MODAL HASIL PENGUNDIAN */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden max-h-[92vh] flex flex-col justify-between"
            >
              {modalStage === 'ANIMATION' ? (
                <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-6 my-auto max-w-md mx-auto w-full">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 animate-spin">
                      <Dices className="w-12 h-12" />
                    </div>
                    <div className="absolute -inset-2 rounded-full border-4 border-dashed border-blue-400/40 animate-[spin_3s_linear_infinite]"></div>
                  </div>

                  <div className="w-full space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                      Sedang Mengocok Nama...
                    </span>
                    <div className="py-3 px-6 rounded-2xl bg-blue-50/90 dark:bg-blue-950/80 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-extrabold text-base sm:text-xl tracking-tight shadow-inner text-center animate-pulse flex items-center justify-center gap-2 min-h-[52px]">
                      <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                      <span className="truncate">{rollingName || 'Mengacak Nama...'}</span>
                    </div>
                  </div>

                  <div className="w-full space-y-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      {spinMode === 'INDIVIDUAL' ? 'Sedang Mengacak 1 Mahasiswa...' : 'Sedang Mengacak Kelompok...'}
                    </h3>
                    
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-slate-200/60 dark:border-zinc-700 p-0.5">
                      <motion.div
                        className="bg-blue-600 h-full rounded-full"
                        animate={{ width: `${shuffleProgress}%` }}
                        transition={{ ease: "easeInOut" }}
                      />
                    </div>

                    <p className="text-xs text-slate-500 dark:text-zinc-400 pt-1">
                      {shuffleProgress < 35
                        ? 'Mengacak urutan dan posisi mahasiswa...'
                        : shuffleProgress < 75
                        ? 'Menyeimbangkan kuota dan distribusi kelompok...'
                        : 'Mengkalkulasi keadilan hasil pengundian...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full space-y-4 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/10 pb-3 shrink-0">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span>
                          {spinMode === 'INDIVIDUAL'
                            ? 'Hasil Pengundian Individu'
                            : `Hasil Pembagian ${groupResults.length} Kelompok`}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {spinMode === 'INDIVIDUAL'
                          ? 'Terpilih secara acak dan adil dari sistem'
                          : `Total ${studentList.length} mahasiswa terbagi secara adil`}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {spinMode === 'INDIVIDUAL' ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="py-10 sm:py-16 text-center bg-gradient-to-b from-sky-50/70 to-blue-50/40 dark:from-sky-950/40 dark:to-blue-950/20 rounded-3xl border border-sky-100/80 dark:border-sky-900/60 space-y-4 my-auto shrink-0"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider shadow-xs">
                        <Trophy className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <span>Terpilih:</span>
                      </div>
                      <div className="text-2xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight px-4 animate-bounce">
                        {selectedIndividual}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="overflow-y-auto max-h-[62vh] pr-1 scrollbar-thin">
                      <div className={`grid ${getGridClass(groupResults.length)}`}>
                        {groupResults.map((group, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={idx} 
                            className="p-3 rounded-2xl bg-white/60 dark:bg-zinc-800/50 space-y-1.5 border border-slate-200/50 dark:border-white/5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                {group.name}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-600 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800 px-2 py-0.5 rounded-full shadow-xs border border-slate-100 dark:border-zinc-700">
                                {group.members.length}
                              </span>
                            </div>

                            <ol className="text-xs text-slate-700 dark:text-zinc-300 space-y-0.5 list-decimal list-inside font-medium pt-0.5">
                              {group.members.map((member, mIdx) => (
                                <li key={mIdx} className="line-clamp-1 leading-snug">
                                  {member}
                                </li>
                              ))}
                            </ol>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-200/40 dark:border-white/10 shrink-0">
                    <button
                      onClick={handleReshuffle}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Putar Ulang</span>
                    </button>

                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};