import React, { useState } from 'react';
import { Dices, RefreshCw, Copy, Check, Save, Users, Sparkles, X, RotateCcw, Trophy, UserCheck, Lock } from 'lucide-react';
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

  // 2-Stage Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<'ANIMATION' | 'RESULT'>('ANIMATION');
  const [spinMode, setSpinMode] = useState<'GROUPS' | 'INDIVIDUAL'>('GROUPS');
  const [selectedIndividual, setSelectedIndividual] = useState<string | null>(null);
  const [groupResults, setGroupResults] = useState<{ name: string; members: string[] }[]>([]);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [rollingName, setRollingName] = useState<string>('');
  const [shuffleProgress, setShuffleProgress] = useState<number>(0);

  // Parse student names from text area
  const studentList = studentsText
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Rapid name rolling & progress bar animation effect when in ANIMATION stage
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

  // Full Fair Random Group Generator Algorithm
  const generateGroupsInternal = () => {
    if (studentList.length === 0) return [];

    // Shuffle student list using Fisher-Yates
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

    // Distribute evenly
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

  const handleCopyResults = () => {
    let text = '';
    if (spinMode === 'INDIVIDUAL') {
      if (!selectedIndividual) return;
      text = `📌 *HASIL UNDIAN INDIVIDU KELAS A*\n\n🎯 *Mahasiswa Terpilih:* ${selectedIndividual}\n\n_Diundi otomatis menggunakan myMbud Portal_`;
    } else {
      if (groupResults.length === 0) return;
      text = `📌 *HASIL UNDIAN KELOMPOK KELAS A*\n\n`;
      groupResults.forEach((g) => {
        text += `*${g.name}* (${g.members.length} Anggota):\n`;
        g.members.forEach((m, idx) => {
          text += `  ${idx + 1}. ${m}\n`;
        });
        text += `\n`;
      });
      text += `_Diundi otomatis menggunakan myMbud Portal_`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToBackend = () => {
    if (groupResults.length === 0) return;
    onSaveGroupResult({
      title: `Hasil Pembagian ${groupResults.length} Kelompok`,
      groupCount: groupResults.length,
      groups: groupResults,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Helper for dynamic grid layout based on group count
  const getGridClass = (count: number) => {
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3';
    if (count <= 8) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <Dices className="w-3.5 h-3.5" />
            <span>Alat Interaktif Kelas A</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-zinc-100">Pembagian Kelompok & Acak Nama</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Sistem pengocokan nama mahasiswa secara acak dan transparan untuk kelompok maupun undian individu.
          </p>
        </div>
      </div>

      {/* Main Minimal Form Container */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-6 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Daftar Anggota Kelas A ({studentList.length} Orang)</span>
          </h3>
          {isOfficer && (
            <button
              onClick={() => setStudentsText(defaultStudentsList.join('\n'))}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Daftar (30 Orang)</span>
            </button>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Masukkan Nama Mahasiswa (1 nama per baris):
            </label>
          </div>
          <textarea
            rows={8}
            readOnly={!isOfficer}
            value={studentsText}
            onChange={(e) => setStudentsText(e.target.value)}
            placeholder="Ahmad Fauzi&#10;Budi Santoso&#10;Citra Dewi..."
            className={`w-full p-4 rounded-2xl text-xs font-mono focus:outline-none transition-all ${
              isOfficer
                ? 'bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500'
                : 'bg-slate-100/70 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 cursor-not-allowed select-none'
            }`}
          />
        </div>

        {/* Grouping Method Selection */}
        <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Metode Pembagian Kelompok</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGroupMode('COUNT')}
              className={`p-3.5 rounded-2xl text-xs font-semibold transition-all ${
                groupMode === 'COUNT'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700'
              }`}
            >
              Berdasarkan Jumlah Kelompok
            </button>
            <button
              type="button"
              onClick={() => setGroupMode('SIZE')}
              className={`p-3.5 rounded-2xl text-xs font-semibold transition-all ${
                groupMode === 'SIZE'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700'
              }`}
            >
              Berdasarkan Jumlah Anggota per Kelompok
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">
              {groupMode === 'COUNT' ? 'Target Jumlah Kelompok:' : 'Target Anggota per Kelompok:'}
            </span>
            <input
              type="number"
              min={1}
              max={30}
              value={groupValue}
              onChange={(e) => setGroupValue(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            <span className="text-xs text-slate-600 dark:text-zinc-400">
              {groupMode === 'COUNT' ? 'Kelompok' : 'Orang'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleStartSpin}
            disabled={studentList.length === 0}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mulai Acak Kelompok</span>
          </button>

          <button
            onClick={handleStartIndividual}
            disabled={studentList.length === 0}
            className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Acak 1 Orang (Individu)</span>
          </button>
        </div>
      </div>

      {/* 2-STAGE POP-UP MODAL (PROJECTOR VIEWPORT OPTIMIZED) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden max-h-[92vh] flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
            {/* STAGE 1: ANIMATION STAGE */}
            {modalStage === 'ANIMATION' ? (
              <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-6 my-auto max-w-md mx-auto w-full">
                {/* Rolling Wheel Icon & Pulse */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 animate-spin">
                    <Dices className="w-12 h-12" />
                  </div>
                  <div className="absolute -inset-2 rounded-full border-4 border-dashed border-blue-400/40 animate-[spin_3s_linear_infinite]"></div>
                </div>

                {/* Rapidly Rolling Student Name Box */}
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
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-slate-200/60 dark:border-zinc-700 p-0.5">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-75 ease-out shadow-xs"
                      style={{ width: `${shuffleProgress}%` }}
                    ></div>
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
              /* STAGE 2: RESULT STAGE */
              <div className="flex flex-col h-full space-y-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
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
                    className="p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content Area */}
                {spinMode === 'INDIVIDUAL' ? (
                  /* Individual Result View */
                  <div className="py-10 sm:py-16 text-center bg-gradient-to-b from-sky-50 to-blue-50/40 dark:from-sky-950/40 dark:to-blue-950/20 rounded-3xl border border-sky-100/80 dark:border-sky-900/60 space-y-4 my-auto shrink-0">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider shadow-xs">
                      <Trophy className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>Mahasiswa Terpilih</span>
                    </div>
                    <div className="text-2xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight px-4 animate-bounce">
                      {selectedIndividual}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Terpilih secara acak dari total {studentList.length} mahasiswa Kelas A
                    </p>
                  </div>
                ) : (
                  /* Group Cards Grid (No-Scroll Viewport Optimized) */
                  <div className="overflow-y-auto max-h-[62vh] pr-1 scrollbar-thin">
                    <div className={`grid ${getGridClass(groupResults.length)}`}>
                      {groupResults.map((group, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 space-y-1.5 border border-slate-100/80 dark:border-zinc-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              {group.name}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full shadow-xs border border-slate-100 dark:border-zinc-700">
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                  <button
                    onClick={handleReshuffle}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Putar Ulang</span>
                  </button>

                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
