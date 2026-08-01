import React, { useState } from 'react';
import { Calculator, Plus, Trash2, Award, Target, RefreshCw } from 'lucide-react';
import { CourseGrade, GradeComponent } from '../types';

interface GradeCalculatorViewProps {
  courseGrades?: CourseGrade[];
}

export const GradeCalculatorView: React.FC<GradeCalculatorViewProps> = () => {
  const [sks, setSks] = useState<number>(3);
  const [components, setComponents] = useState<GradeComponent[]>([
    { id: 'c1', name: 'Tugas Mandiri / Praktikum', weight: 20, score: 85 },
    { id: 'c2', name: 'Tugas Kelompok / Proyek', weight: 20, score: 88 },
    { id: 'c3', name: 'Kuis & Kehadiran', weight: 10, score: 90 },
    { id: 'c4', name: 'Ujian Tengah Semester (UTS)', weight: 25, score: 82 },
    { id: 'c5', name: 'Ujian Akhir Semester (UAS)', weight: 25, score: 85 },
  ]);

  const [targetLetter, setTargetLetter] = useState<'A' | 'A-' | 'B+' | 'B'>('A');

  // Grade conversion rules (4.0 scale)
  const getLetterGradeAndGpa = (finalScore: number) => {
    if (finalScore >= 85) return { letter: 'A', gpa: 4.0, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (finalScore >= 80) return { letter: 'A-', gpa: 3.7, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (finalScore >= 75) return { letter: 'B+', gpa: 3.3, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (finalScore >= 70) return { letter: 'B', gpa: 3.0, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (finalScore >= 65) return { letter: 'B-', gpa: 2.7, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (finalScore >= 60) return { letter: 'C+', gpa: 2.3, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (finalScore >= 55) return { letter: 'C', gpa: 2.0, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (finalScore >= 45) return { letter: 'D', gpa: 1.0, bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    return { letter: 'E', gpa: 0.0, bg: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  const targetThresholds = { A: 85, 'A-': 80, 'B+': 75, B: 70 };

  const totalWeight = components.reduce((acc, c) => acc + c.weight, 0);
  const currentFinalScore = components.reduce(
    (acc, c) => acc + (c.score * c.weight) / 100,
    0
  );

  const gradeInfo = getLetterGradeAndGpa(currentFinalScore);

  const uasComponent = components[components.length - 1];
  const uasWeight = uasComponent ? uasComponent.weight : 25;

  const scoreWithoutUas = components
    .slice(0, -1)
    .reduce((acc, c) => acc + (c.score * c.weight) / 100, 0);

  const targetMinScore = targetThresholds[targetLetter] || 85;
  const neededUasScore = uasWeight > 0 ? ((targetMinScore - scoreWithoutUas) / uasWeight) * 100 : 0;

  const handleScoreChange = (compIdx: number, newScore: number) => {
    const newComps = [...components];
    newComps[compIdx] = { ...newComps[compIdx], score: Math.min(100, Math.max(0, newScore)) };
    setComponents(newComps);
  };

  const handleWeightChange = (compIdx: number, newWeight: number) => {
    const newComps = [...components];
    newComps[compIdx] = { ...newComps[compIdx], weight: Math.max(0, newWeight) };
    setComponents(newComps);
  };

  const handleNameChange = (compIdx: number, newName: string) => {
    const newComps = [...components];
    newComps[compIdx] = { ...newComps[compIdx], name: newName };
    setComponents(newComps);
  };

  const handleAddComponent = () => {
    const newComp: GradeComponent = {
      id: `c-${Date.now()}`,
      name: 'Komponen Baru',
      weight: 10,
      score: 80,
    };
    setComponents([...components, newComp]);
  };

  const handleDeleteComponent = (compIdx: number) => {
    setComponents(components.filter((_, idx) => idx !== compIdx));
  };

  const handleReset = () => {
    setSks(3);
    setComponents([
      { id: 'c1', name: 'Tugas Mandiri / Praktikum', weight: 20, score: 85 },
      { id: 'c2', name: 'Tugas Kelompok / Proyek', weight: 20, score: 88 },
      { id: 'c3', name: 'Kuis & Kehadiran', weight: 10, score: 90 },
      { id: 'c4', name: 'Ujian Tengah Semester (UTS)', weight: 25, score: 82 },
      { id: 'c5', name: 'Ujian Akhir Semester (UAS)', weight: 25, score: 85 },
    ]);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 p-5 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Kalkulator Nilai</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Simulasi fleksibel untuk menghitung persentase bobot komponen dan mencari target nilai minimal.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          <span>Reset Kalkulator</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 Cols): Components Weight & Score Inputs */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Simulasi Komponen Penilaian</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Total Bobot Komponen Saat Ini: <span className="font-bold text-slate-700 dark:text-zinc-300">{totalWeight}%</span></p>
            </div>

            {/* Input SKS Manual Dropdown / Selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/80 p-2 rounded-2xl border border-slate-200/80 dark:border-zinc-700 shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 pl-1">Beban SKS:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((sksVal) => (
                  <button
                    key={sksVal}
                    type="button"
                    onClick={() => setSks(sksVal)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      sks === sksVal
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-600 border border-slate-200/60 dark:border-zinc-600'
                    }`}
                  >
                    {sksVal} SKS
                  </button>
                ))}
              </div>
            </div>
          </div>

          {totalWeight !== 100 && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center justify-between">
              <span>⚠️ Total bobot komponen saat ini {totalWeight}%.</span>
              <span className="font-bold">Target Ideal: 100%</span>
            </div>
          )}

          {/* Component Sliders & Numerical Inputs */}
          <div className="space-y-3.5">
            {components.map((comp, idx) => (
              <div key={comp.id || idx} className="p-4 rounded-2xl bg-slate-50/90 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    value={comp.name}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    placeholder="Nama Komponen"
                    className="bg-transparent text-xs font-bold text-slate-900 dark:text-zinc-100 border-b border-slate-300 dark:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none py-0.5 flex-1 min-w-[140px]"
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Bobot:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={comp.weight}
                      onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-14 px-2 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold">%</span>

                    <button
                      onClick={() => handleDeleteComponent(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Hapus Komponen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Score Slider & Value Box */}
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={comp.score}
                    onChange={(e) => handleScoreChange(idx, parseFloat(e.target.value))}
                    className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg"
                  />

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Nilai:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={comp.score}
                      onChange={(e) => handleScoreChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-16 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddComponent}
            className="w-full py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-dashed border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Tambah Komponen Penilaian</span>
          </button>
        </div>

        {/* Right Column (5 Cols): Result Card & Target Solver */}
        <div className="lg:col-span-5 space-y-5">
          {/* Projected Final Grade Summary Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Hasil Proyeksi Nilai
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">Skala 4.0</span>
            </div>

            <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-zinc-800/60 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Proyeksi Angka Akhir</p>
                <p className="text-3xl font-black text-slate-900 dark:text-zinc-100 font-mono mt-0.5">
                  {currentFinalScore.toFixed(1)} <span className="text-sm font-semibold text-slate-400 dark:text-zinc-500">/ 100</span>
                </p>
                {/* Dynamically synchronized SKS */}
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">Bobot SKS: {sks} SKS</p>
              </div>

              <div className={`px-5 py-3 rounded-2xl border text-center ${gradeInfo.bg}`}>
                <div className="text-3xl font-black font-mono">{gradeInfo.letter}</div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">
                  IP: {gradeInfo.gpa.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Standard Conversion Legend */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 space-y-1">
              <p className="font-bold text-slate-800 dark:text-zinc-200">Standar Konversi Huruf Mutu ITS:</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                <span>A  : 85.0 - 100.0 (4.0)</span>
                <span>AB : 75.0 - 84.9 (3.5)</span>
                <span>B  : 65.0 - 74.9 (3.0)</span>
                <span>BC : 60.0 - 64.9 (2.5)</span>
              </div>
            </div>
          </div>

          {/* Target Grade Solver Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Target Grade Solver
              </span>
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                Fitur Pintar
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Berapa nilai ujian akhir / komponen terakhir ({uasComponent ? uasComponent.name : 'UAS'}) yang harus kamu raih untuk mendapat huruf mutu target?
            </p>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Target Huruf Mutu:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700">
                {(['A', 'A-', 'B+', 'B'] as const).map((lettr) => (
                  <button
                    key={lettr}
                    type="button"
                    onClick={() => setTargetLetter(lettr)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      targetLetter === lettr
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {lettr}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Solution Result */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 space-y-2">
              <div className="text-[11px] text-slate-600 dark:text-zinc-300">
                Nilai <span className="font-bold text-slate-800 dark:text-zinc-100">{uasComponent ? uasComponent.name : 'UAS'}</span> Minimal yang Dibutuhkan:
              </div>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">
                {neededUasScore > 100 ? (
                  <span className="text-rose-600 dark:text-rose-400 text-xs font-semibold block leading-snug">
                    ⚠️ Mustahil (&gt; 100). Nilai komponen sebelumnya kurang tinggi.
                  </span>
                ) : neededUasScore <= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold block leading-snug">
                    🎉 Nilai kamu sudah mencukupi target tanpa perlu UAS!
                  </span>
                ) : (
                  <span>
                    {neededUasScore.toFixed(1)} <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">/ 100</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 italic">
                Berdasarkan kalkulasi akumulasi nilai komponen saat ini ({scoreWithoutUas.toFixed(1)} poin dari total bobot).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
