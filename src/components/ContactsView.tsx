import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, MessageSquare, Plus, Edit2, Trash2, GraduationCap, UserCheck, X } from 'lucide-react';
import { Contact } from '../types';

interface ContactsViewProps {
  contacts: Contact[];
  isOfficer: boolean;
  initialCourseFilter?: string;
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onUpdateContact: (id: string, contact: Partial<Contact>) => void;
  onDeleteContact: (id: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  isOfficer,
  initialCourseFilter = 'ALL',
  onAddContact,
  onUpdateContact,
  onDeleteContact,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState(initialCourseFilter || 'ALL');

  useEffect(() => {
    if (initialCourseFilter) {
      setSelectedCourseFilter(initialCourseFilter);
    }
  }, [initialCourseFilter]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formLecturerName, setFormLecturerName] = useState('');
  const [formLecturerPhone, setFormLecturerPhone] = useState('');
  const [formPjName, setFormPjName] = useState('');
  const [formPjPhone, setFormPjPhone] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formScheduleDayTime, setFormScheduleDayTime] = useState('');
  const [formSks, setFormSks] = useState<number | ''>('');

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTarget, setTemplateTarget] = useState<{ name: string; phone: string; role: 'Lecturer' | 'PJ'; course: string } | null>(null);

  const formatWaNumber = (phoneStr: string) => {
    let clean = phoneStr.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  const filteredContacts = contacts.filter((c) => {
    const matchSearch =
      c.course.toLowerCase().includes(search.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(search.toLowerCase())) ||
      (c.lecturerName && c.lecturerName.toLowerCase().includes(search.toLowerCase())) ||
      c.pjName.toLowerCase().includes(search.toLowerCase());
    const matchCourse = selectedCourseFilter === 'ALL' || c.course === selectedCourseFilter;
    return matchSearch && matchCourse;
  });

  const uniqueCourses = Array.from(new Set(contacts.map((c) => c.course)));

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormCode('');
    setFormCourse('');
    setFormLecturerName('');
    setFormLecturerPhone('');
    setFormPjName('');
    setFormPjPhone('');
    setFormRoom('');
    setFormScheduleDayTime('');
    setFormSks('');
    setShowModal(true);
  };

  const handleOpenEditModal = (c: any) => {
    setEditingId(c.id);
    setFormCode(c.code || '');
    setFormCourse(c.course);
    setFormLecturerName(c.lecturerName);
    setFormLecturerPhone(c.lecturerPhone);
    setFormPjName(c.pjName);
    setFormPjPhone(c.pjPhone);
    setFormRoom(c.room || '');
    setFormScheduleDayTime(c.scheduleDayTime || '');
    setFormSks(c.sks || '');
    setShowModal(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourse.trim() || !formLecturerName.trim()) return;

    const payload: any = {
      code: formCode,
      course: formCourse,
      lecturerName: formLecturerName,
      lecturerPhone: formLecturerPhone,
      pjName: formPjName,
      pjPhone: formPjPhone,
      room: formRoom,
      scheduleDayTime: formScheduleDayTime,
      sks: Number(formSks) || 0,
    };

    if (editingId) {
      onUpdateContact(editingId, payload);
    } else {
      onAddContact(payload);
    }

    setShowModal(false);
  };

  const openTemplate = (name: string, phone: string, role: 'Lecturer' | 'PJ', course: string) => {
    setTemplateTarget({ name, phone, role, course });
    setShowTemplateModal(true);
  };

  const generateWaLink = (phone: string, text: string) => {
    const cleanPhone = formatWaNumber(phone);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Kontak Dosen & PJ Matkul</h2>
        </div>

        {isOfficer && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kontak</span>
          </motion.button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari matkul, dosen, atau PJ..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none"
          />
        </div>

        <select
          value={selectedCourseFilter}
          onChange={(e) => setSelectedCourseFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none"
        >
          <option value="ALL">Semua Mata Kuliah ({contacts.length})</option>
          {uniqueCourses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredContacts.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-500 text-xs shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] dark:shadow-none">
            Tidak ada kontak ditemukan untuk pencarian atau filter saat ini.
          </div>
        ) : (
          <AnimatePresence>
            {filteredContacts.map((c: any) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={c.id}
                className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 mb-4">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
                        {c.code || 'Mata Kuliah'} {c.sks ? `• ${c.sks} SKS` : ''}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 mt-2">{c.course}</h3>
                      {c.scheduleDayTime && (
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          {c.scheduleDayTime} ({c.room || 'R. Kelas'})
                        </p>
                      )}
                    </div>

                    {isOfficer && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
                          title="Edit Kontak"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteContact(c.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-2.5">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 shrink-0">Dosen:</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {c.lecturerName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={generateWaLink(
                            c.lecturerPhone,
                            `Selamat pagi/siang Bapak/Ibu ${c.lecturerName}, mohon maaf mengganggu waktunya. Saya mahasiswa Kelas A peserta mata kuliah ${c.course}...`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat WA</span>
                        </motion.a>

                        <button
                          onClick={() => openTemplate(c.lecturerName, c.lecturerPhone, 'Lecturer', c.course)}
                          className="px-3 py-2 rounded-xl bg-slate-200/60 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-all"
                          title="Template Pesan Sopan"
                        >
                          Template
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 space-y-2.5">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 shrink-0">PJ Matkul:</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {c.pjName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <motion.a
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          href={formatWaNumber(c.pjPhone) ? `https://wa.me/${formatWaNumber(c.pjPhone)}` : '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-800 dark:text-zinc-200 font-semibold text-xs transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Chat WA PJ</span>
                        </motion.a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Modal: Add or Edit Contact */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  {editingId ? 'Edit Data Kontak Matkul' : 'Tambah Kontak Matkul Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveContact} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Kode Matkul</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="DS234316"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Nama Mata Kuliah</label>
                      <input
                        type="text"
                        required
                        value={formCourse}
                        onChange={(e) => setFormCourse(e.target.value)}
                        placeholder="Manusia dan Ruang Hidup"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Nama Dosen</label>
                      <input
                        type="text"
                        required
                        value={formLecturerName}
                        onChange={(e) => setFormLecturerName(e.target.value)}
                        placeholder="Prof. Dr. Hendra, M.T."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">WhatsApp Dosen</label>
                      <input
                        type="text"
                        required
                        value={formLecturerPhone}
                        onChange={(e) => setFormLecturerPhone(e.target.value)}
                        placeholder="081234567890"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Nama PJ Matkul</label>
                      <input
                        type="text"
                        required
                        value={formPjName}
                        onChange={(e) => setFormPjName(e.target.value)}
                        placeholder="Dimas Ardiansyah"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">WhatsApp PJ Matkul</label>
                      <input
                        type="text"
                        required
                        value={formPjPhone}
                        onChange={(e) => setFormPjPhone(e.target.value)}
                        placeholder="085712345678"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Ruang Perkuliahan</label>
                      <input
                        type="text"
                        value={formRoom}
                        onChange={(e) => setFormRoom(e.target.value)}
                        placeholder="R. 301 Gedung Utama"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Jadwal Hari/Jam</label>
                      <input
                        type="text"
                        value={formScheduleDayTime}
                        onChange={(e) => setFormScheduleDayTime(e.target.value)}
                        placeholder="Senin, 08:00 - 10:30 WIB"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">SKS</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={formSks}
                        onChange={(e) => setFormSks(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="3"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Batal
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                  >
                    Simpan Kontak
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Template */}
      <AnimatePresence>
        {showTemplateModal && templateTarget && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Pilih Template Pesan WhatsApp ({templateTarget.role === 'Lecturer' ? 'Dosen' : 'PJ Matkul'})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-3">
                {[
                  {
                    title: 'Izin Menanyakan Materi / Slide Presentasi',
                    msg: `Selamat pagi/siang Yth. ${templateTarget.name}, mohon maaf mengganggu waktunya Bapak/Ibu. Saya mahasiswa Kelas A mata kuliah ${templateTarget.course}. Izin bertanya mengenai file slide presentasi pertemuan minggu ini, apakah sudah dapat diakses via myITS Classroom? Terima kasih Bapak/Ibu.`,
                  },
                  {
                    title: 'Permohonan Izin Berhalangan Hadir',
                    msg: `Selamat pagi/siang Yth. ${templateTarget.name}. Saya (Nama Mahasiswa) (NRP:) dari Kelas A mata kuliah ${templateTarget.course}. Izin menyampaikan bahwa pada perkuliahan hari ini saya berhalangan hadir dikarenakan [Alasan]. Surat izin resmi telah saya lampirkan di myITS Presensi. Terima kasih atas pengertiannya Bapak/Ibu.`,
                  },
                ].map((tmpl, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400">{tmpl.title}</h4>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed italic bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-xs border border-slate-100 dark:border-zinc-800">
                      "{tmpl.msg}"
                    </p>
                    <motion.a
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      href={generateWaLink(templateTarget.phone, tmpl.msg)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setShowTemplateModal(false)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Kirim via WhatsApp</span>
                    </motion.a>
                  </div>
                ))}
              </div>

              <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end shrink-0 bg-white dark:bg-zinc-900">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};