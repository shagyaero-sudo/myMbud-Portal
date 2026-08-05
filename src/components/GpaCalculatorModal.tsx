import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Plus,
  Trash2,
  X,
  RotateCcw,
  Edit3,
  Check,
  ShieldCheck,
} from 'lucide-react';

export interface CourseItem {
  id: string;
  name: string;
  sks: number;
  grade: string;
}

const GRADE_POINTS: Record<string, number> = {
  A: 4.0,
  AB: 3.5,
  B: 3.0,
  BC: 2.5,
  C: 2.0,
  D: 1.0,
  E: 0.0,
};

const DEFAULT_COURSES: CourseItem[] = [
  { id: '1', name: 'Dasar-dasar Manajemen', sks: 2, grade: '' },
  { id: '2', name: 'Ekonomi Makro', sks: 2, grade: '' },
  { id: '3', name: 'Etika Pembangunan', sks: 2, grade: '' },
  { id: '4', name: 'Gender dan Pembangunan', sks: 3, grade: '' },
  { id: '5', name: 'Infrastruktur Pembangunan', sks: 3, grade: '' },
  { id: '6', name: 'Kebijakan Publik dan Pembangunan', sks: 2, grade: '' },
  { id: '7', name: 'Komunikasi Pembangunan', sks: 2, grade: '' },
  { id: '8', name: 'Manusia dan Ruang Hidup', sks: 3, grade: '' },
  { id: '9', name: 'Statistik Sosial', sks: 2, grade: '' },
];

const LOCAL_STORAGE_KEY = 'mymbud_gpa_courses';

interface GpaCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GpaCalculatorModal: React.FC<GpaCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [courses, setCourses] = useState<CourseItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_COURSES;
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  const handleGradeChange = (id: string, grade: string) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, grade } : c))
    );
  };

  const handleCourseChange = (id: string, field: 'name' | 'sks', value: any) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleAddCourse = () => {
    const newCourse: CourseItem = {
      id: Date.now().toString(),
      name: 'Mata Kuliah Baru',
      sks: 3,
      grade: '',
    };
    setCourses((prev) => [...prev, newCourse]);
  };

  const handleDeleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReset = () => {
    if (confirm('Kembalikan ke susunan FRS default?')) {
      setCourses(DEFAULT_COURSES);
    }
  };

  const totalSks = courses.reduce((acc, c) => acc + (Number(c.sks) || 0), 0);
  const totalPoints = courses.reduce((acc, c) => {
    const point = GRADE_POINTS[c.grade] ?? 0;
    return acc + point * (Number(c.sks) || 0);
  }, 0);

  const filledSks = courses.reduce((acc, c) => {
    return c.grade !== '' ? acc + (Number(c.sks) || 0) : acc;
  }, 0);

  const gpa = filledSks > 0 ? (totalPoints / filledSks).toFixed(2) : '0.00';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                    Simulasi IPK FRS
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                    Hitung prediksi IPS dengan indeks nilai.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Banner Skor */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-100 block">
                  PREDIKSI IPS SEMESTER INI
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight">{gpa}</span>
                  <span className="text-[10px] sm:text-xs text-amber-100 font-medium truncate">
                    / 4.00 ({filledSks} dari {totalSks} SKS)
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-xs"
              >
                {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Selesai Edit' : 'Adjust FRS'}</span>
              </button>
            </div>

            {/* List Matkul (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <input
                        type="text"
                        value={course.name}
                        onChange={(e) =>
                          handleCourseChange(course.id, 'name', e.target.value)
                        }
                        className="flex-1 min-w-0 text-xs font-semibold px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:outline-none"
                      />
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={course.sks}
                        onChange={(e) =>
                          handleCourseChange(course.id, 'sks', Number(e.target.value))
                        }
                        className="w-10 text-xs text-center font-bold px-1 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:outline-none shrink-0"
                      />
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                          {course.name}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                          {course.sks} SKS
                        </span>
                      </div>

                      <select
                        value={course.grade}
                        onChange={(e) => handleGradeChange(course.id, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer shrink-0"
                      >
                        <option value="">Nilai--</option>
                        <option value="A">A (4.0)</option>
                        <option value="AB">AB (3.5)</option>
                        <option value="B">B (3.0)</option>
                        <option value="BC">BC (2.5)</option>
                        <option value="C">C (2.0)</option>
                        <option value="D">D (1.0)</option>
                        <option value="E">E (0.0)</option>
                      </select>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="px-3 py-2 bg-emerald-50/60 dark:bg-emerald-950/20 border-t border-emerald-100/80 dark:border-emerald-900/40 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-[9px] font-medium leading-tight">
                <span className="font-bold">100% Rahasia & Aman:</span> Indeks nilai yang kamu masukkan hanya tersimpan di perangkatmu.
              </p>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
              {isEditing ? (
                <button
                  onClick={handleAddCourse}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Matkul</span>
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold transition-all hover:opacity-90"
              >
                Selesai
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};