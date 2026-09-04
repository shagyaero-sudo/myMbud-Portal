import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareHeart, Send, Loader2, Star } from 'lucide-react';
import { submitAspirationFeedback } from '../services/api';

interface AspirationFormModalProps {
  userNrp: string;
  userName: string;
  onSubmitted: () => void;
}

export const AspirationFormModal: React.FC<AspirationFormModalProps> = ({
  userNrp,
  userName,
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [favoriteFeature, setFavoriteFeature] = useState<string>('');
  const [issuesFound, setIssuesFound] = useState<string>('');
  const [aspirations, setAspirations] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!favoriteFeature.trim()) return;

    setIsSubmitting(true);

    try {
      await submitAspirationFeedback({
        nrp: userNrp,
        nama: userName,
        rating,
        favorite_feature: favoriteFeature.trim(),
        issues_found: issuesFound.trim(),
        aspirations: aspirations.trim(),
      });

      // Panggil callback untuk membuka proteksi
      onSubmitted();
    } catch (error) {
      alert('Gagal mengirim respon ke Supabase, silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 text-slate-800 dark:text-zinc-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto shadow-sm">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Evaluasi & Aspirasi Seminggu myMbud ✨
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Halo <span className="font-bold text-slate-700 dark:text-zinc-200">{userName}</span>! Bantu isi 3 pertanyaan singkat ini untuk pembukaan akses web (Cukup 1x).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 text-center">
              Rating Kepuasan Penggunaan
            </label>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-zinc-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Pertanyaan 1 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              1. Fitur mana yang paling membantu kuliahmu & alasannya? <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={favoriteFeature}
              onChange={(e) => setFavoriteFeature(e.target.value)}
              placeholder="Misal: Tracker Tugas karena ada countdown H-..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Pertanyaan 2 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              2. Apakah ada kendala, bug, atau hal yang bingungin?
            </label>
            <textarea
              rows={2}
              value={issuesFound}
              onChange={(e) => setIssuesFound(e.target.value)}
              placeholder="Tuliskan jika ada kendala teknis (atau ketik 'Aman')"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Pertanyaan 3 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              3. Ada usulan fitur baru / aspirasi untuk ke depannya?
            </label>
            <textarea
              rows={2}
              value={aspirations}
              onChange={(e) => setAspirations(e.target.value)}
              placeholder="Ide fitur impian kamu buat perkuliahan..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting || !favoriteFeature.trim()}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer pt-2.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Supabase...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim & Buka Akses myMbud</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};