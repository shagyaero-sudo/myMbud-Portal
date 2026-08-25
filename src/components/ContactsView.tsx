import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  UserCheck,
  X,
  ChevronDown,
} from 'lucide-react';
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
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState(
    initialCourseFilter || 'ALL'
  );

  useEffect(() => {
    setSearch('');
    setSelectedCourseFilter(initialCourseFilter || 'ALL');

    return () => {
      setSearch('');
      setSelectedCourseFilter('ALL');
    };
  }, [initialCourseFilter]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formLecturerName, setFormLecturerName] = useState('');
  const [formLecturerPhone, setFormLecturerPhone] = useState('');
  const [formLecturerName2, setFormLecturerName2] = useState('');
  const [formLecturerPhone2, setFormLecturerPhone2] = useState('');
  const [formPjName, setFormPjName] = useState('');
  const [formPjPhone, setFormPjPhone] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formScheduleDayTime, setFormScheduleDayTime] = useState('');
  const [formSks, setFormSks] = useState<number | ''>('');
  const [formAttendanceUrl, setFormAttendanceUrl] = useState('');
  const [formTargetNrps, setFormTargetNrps] = useState('');

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTarget, setTemplateTarget] = useState<{
    name: string;
    phone: string;
    course: string;
  } | null>(null);

  const [openTemplateIndex, setOpenTemplateIndex] = useState<number | null>(0);

  const currentUserNrp =
    typeof window !== 'undefined'
      ? (localStorage.getItem('mymbud_user_nrp') || '').trim().toLowerCase()
      : '';

  const formatWaNumber = (phoneStr: string) => {
    if (!phoneStr) return '';
    let clean = phoneStr.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  const parseSchedule = (scheduleStr: string = '') => {
    const dayMap: Record<string, number> = {
      senin: 1,
      selasa: 2,
      rabu: 3,
      kamis: 4,
      jumat: 5,
      sabtu: 6,
      minggu: 7,
    };

    const parts = scheduleStr.split(',');
    const dayName = parts[0]?.trim().toLowerCase() || '';
    const dayOrder = dayMap[dayName] || 99;

    const timePart = parts[1]?.trim() || '';
    const startTime = timePart.split('-')[0]?.trim() || '23:59';

    return { dayOrder, startTime };
  };

  const parseTargetNrps = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          const str = String(item).trim();
          const match = str.match(/\d{7,14}/);
          return match ? match[0] : str.toLowerCase();
        })
        .filter(Boolean);
    }
    if (typeof raw === 'string') {
      const clean = raw.replace(/[{}"']/g, '');
      return clean
        .split(/[\n,]+/)
        .map((item) => {
          const str = item.trim();
          const match = str.match(/\d{7,14}/);
          return match ? match[0] : str.toLowerCase();
        })
        .filter(Boolean);
    }
    return [];
  };

  const filteredContacts = contacts
    .filter((c: any) => {
      const nrps = parseTargetNrps(c.target_nrps || c.targetNrps);

      if (!isOfficer && nrps.length > 0) {
        if (!currentUserNrp || currentUserNrp === 'unknown' || !nrps.includes(currentUserNrp)) {
          return false;
        }
      }

      const matchSearch =
        c.course.toLowerCase().includes(search.toLowerCase()) ||
        (c.code && c.code.toLowerCase().includes(search.toLowerCase())) ||
        (c.lecturerName &&
          c.lecturerName.toLowerCase().includes(search.toLowerCase())) ||
        (c.lecturerName2 &&
          c.lecturerName2.toLowerCase().includes(search.toLowerCase())) ||
        c.pjName.toLowerCase().includes(search.toLowerCase());
      const matchCourse =
        selectedCourseFilter === 'ALL' || c.course === selectedCourseFilter;
      return matchSearch && matchCourse;
    })
    .sort((a, b) => {
      const schedA = parseSchedule(a.scheduleDayTime);
      const schedB = parseSchedule(b.scheduleDayTime);

      if (schedA.dayOrder !== schedB.dayOrder) {
        return schedA.dayOrder - schedB.dayOrder;
      }
      return schedA.startTime.localeCompare(schedB.startTime);
    });

  const uniqueCourses = Array.from(new Set(contacts.map((c) => c.course)));

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormCode('');
    setFormCourse('');
    setFormLecturerName('');
    setFormLecturerPhone('');
    setFormLecturerName2('');
    setFormLecturerPhone2('');
    setFormPjName('');
    setFormPjPhone('');
    setFormRoom('');
    setFormScheduleDayTime('');
    setFormSks('');
    setFormAttendanceUrl('');
    setFormTargetNrps('');
    setShowModal(true);
  };

  const handleOpenEditModal = (c: any) => {
    setEditingId(c.id);
    setFormCode(c.code || '');
    setFormCourse(c.course);
    setFormLecturerName(c.lecturerName || '');
    setFormLecturerPhone(c.lecturerPhone || '');
    setFormLecturerName2(c.lecturerName2 || '');
    setFormLecturerPhone2(c.lecturerPhone2 || '');
    setFormPjName(c.pjName || '');
    setFormPjPhone(c.pjPhone || '');
    setFormRoom(c.room || '');
    setFormScheduleDayTime(c.scheduleDayTime || '');
    setFormSks(c.sks || '');
    setFormAttendanceUrl(c.attendanceUrl || '');

    const rawTargetNrps = c.target_nrps || c.targetNrps;
    if (Array.isArray(rawTargetNrps)) {
      setFormTargetNrps(rawTargetNrps.join('\n'));
    } else if (typeof rawTargetNrps === 'string') {
      const clean = rawTargetNrps.replace(/[{}"']/g, '');
      setFormTargetNrps(clean.split(',').map((s) => s.trim()).join('\n'));
    } else {
      setFormTargetNrps('');
    }

    setShowModal(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourse.trim() || !formLecturerName.trim()) return;

    // OTOMATIS AMBIL DIGIT ANGKA NRP DARI TIAP BARIS (Abaikan Nama dan Huruf)
    const parsedNrps = formTargetNrps
      .split(/[\n,]+/)
      .map((line) => {
        const match = line.match(/\d{7,14}/);
        return match ? match[0].trim() : '';
      })
      .filter((nrp) => nrp.length > 0);

    const payload: any = {
      code: formCode.trim(),
      course: formCourse.trim(),
      lecturerName: formLecturerName.trim(),
      lecturerPhone: formLecturerPhone.trim(),
      lecturerName2: formLecturerName2.trim(),
      lecturerPhone2: formLecturerPhone2.trim(),
      pjName: formPjName.trim(),
      pjPhone: formPjPhone.trim(),
      room: formRoom.trim(),
      scheduleDayTime: formScheduleDayTime.trim(),
      sks: Number(formSks) || 0,
      attendanceUrl: formAttendanceUrl.trim(),
      target_nrps: parsedNrps.length > 0 ? parsedNrps : null,
      targetNrps: parsedNrps.length > 0 ? parsedNrps : null,
    };

    if (editingId) {
      onUpdateContact(editingId, payload);
    } else {
      onAddContact(payload);
    }

    setShowModal(false);
  };

  const openTemplate = (name: string, phone: string, course: string) => {
    setTemplateTarget({ name, phone, course });
    setOpenTemplateIndex(0);
    setShowTemplateModal(true);
  };

  const generateWaLink = (phone: string, text: string) => {
    const cleanPhone = formatWaNumber(phone);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const getLecturerTemplates = () => {
    if (!templateTarget) return [];

    return [
      {
        title: 'Pengingat & Konfirmasi Jadwal Perkuliahan (PJ)',
        msg: `Selamat pagi/siang Yth. Bapak/Ibu ${templateTarget.name}, mohon maaf mengganggu waktunya. Saya [Nama PJ], Penanggung Jawab Kelas A mata kuliah ${templateTarget.course}. Permisi Bapak/Ibu, izin mengingatkan terkait jadwal perkuliahan kita yang akan dilaksanakan pada hari [Hari, Tanggal] pukul [Jam] WIB di ruang [Ruangan]. Mohon konfirmasinya apakah perkuliahan dapat dilaksanakan sesuai jadwal tersebut, atau ada arahan khusus dari Bapak/Ibu? Terima kasih banyak Bapak/Ibu.`,
      },
      {
        title: 'Izin Menanyakan Materi / Slide Presentasi',
        msg: `Selamat pagi/siang Yth. Bapak/Ibu ${templateTarget.name}, mohon maaf mengganggu waktunya. Saya mahasiswa Kelas A mata kuliah ${templateTarget.course}. Izin bertanya mengenai file slide presentasi pertemuan minggu ini, apakah sudah dapat diakses via myITS Classroom? Terima kasih Bapak/Ibu.`,
      },
      {
        title: 'Permohonan Izin Berhalangan Hadir',
        msg: `Selamat pagi/siang Yth. Bapak/Ibu ${templateTarget.name}. Saya [Nama Mahasiswa] (NRP: [NRP]) dari Kelas A mata kuliah ${templateTarget.course}. Izin menyampaikan bahwa pada perkuliahan hari ini saya berhalangan hadir dikarenakan [Alasan]. Surat izin resmi telah saya lampirkan di myITS Presensi. Terima kasih atas pengertiannya Bapak/Ibu.`,
      },
      {
        title: 'Konfirmasi Jadwal Kuliah Pengganti (PJ)',
        msg: `Selamat pagi/siang Yth. Bapak/Ibu ${templateTarget.name}, mohon maaf mengganggu waktunya. Saya [Nama PJ], PJ Kelas A mata kuliah ${templateTarget.course}. Menindaklanjuti perkuliahan yang sebelumnya sempat tertunda, izin berkonsultasi mengenai opsi jadwal Kuliah Pengganti. Dari hasil kesepakatan teman-teman kelas, berikut opsi waktu yang memungkinkan: [Opsi Hari & Jam]. Mohon arahan Bapak/Ibu mengenai opsi mana yang berkenan untuk digunakan. Terima kasih banyak Bapak/Ibu.`,
      },
      {
        title: 'Permohonan Link Perkuliahan Daring (PJ)',
        msg: `Selamat pagi/siang Yth. Bapak/Ibu ${templateTarget.name}, mohon maaf mengganggu waktunya. Saya [Nama PJ], PJ Kelas A mata kuliah ${templateTarget.course}. Menjelang perkuliahan daring kita pada [Hari, Jam], izin menanyakan apakah link platform perkuliahan (Zoom/Teams/GMeet) akan disediakan oleh Bapak/Ibu, atau dari pihak kelas yang memfasilitasi jalannya perkuliahan? Terima kasih banyak atas arahan Bapak/Ibu.`,
      },
      {
        title: 'Permohonan Bimbingan / Konsultasi Tugas',
        msg: `Selamat pagi/siang Yth. Bapak/Ibu ${templateTarget.name}, mohon maaf mengganggu waktunya. Saya [Nama Mahasiswa] (NRP: [NRP]) dari Kelas A mata kuliah ${templateTarget.course}. Permisi Bapak/Ibu, izin memohon waktu bimbingan/konsultasi terkait [Topik Tugas/Laporan Kelompok]. Apabila Bapak/Ibu berkenan, kira-kira kapan saya dapat menemui Bapak/Ibu di ruang dosen atau secara daring? Terima kasih banyak atas arahan Bapak/Ibu.`,
      },
      {
        title: 'Konfirmasi Kendala Pengumpulan Tugas',
        msg: `Selamat pagi/siang Yth. Bapak/Ibu ${templateTarget.name}, mohon maaf mengganggu waktunya. Saya [Nama Mahasiswa] (NRP: [NRP]) dari Kelas A mata kuliah ${templateTarget.course}. Izin menyampaikan bahwa saya mengalami kendala teknis saat mengunggah [Nama Tugas] di myITS Classroom. Berkas tugas telah saya lampirkan melalui pesan ini / [Link GDrive]. Mohon maaf atas ketidaknyamanannya dan terima kasih banyak Bapak/Ibu.`,
      },
      {
        title: 'Klarifikasi Nilai & Presensi Perkuliahan',
        msg: `Selamat pagi/siang Yth. Bapak/Ibu ${templateTarget.name}, mohon maaf mengganggu waktunya. Saya [Nama Mahasiswa] (NRP: [NRP]) dari Kelas A mata kuliah ${templateTarget.course}. Permisi Bapak/Ibu, izin bertanya/mengonfirmasi terkait nilai [Tugas/UTS/UAS] saya yang tercantum pada portal. Izin memastikan apakah ada berkas pendukung atau tugas tambahan yang perlu saya lengkapi kembali? Terima kasih banyak atas perhatian dan kesediaan Bapak/Ibu.`,
      },
      {
        title: 'Lainnya... (Format Pesan Bebas & Sopan)',
        msg: `Selamat pagi/siang Yth. Bapak/Ibu ${templateTarget.name}, mohon maaf mengganggu waktunya. Saya [Nama Mahasiswa] (NRP: [NRP]) dari Kelas A mata kuliah ${templateTarget.course}.\n\n[Tuliskan isi pesan atau keperluanmu di sini...]\n\nTerima kasih banyak atas perhatian dan arahan Bapak/Ibu.`,
      },
    ];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 sm:space-y-6 pb-12"
    >
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-4 sm:pt-6 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            Kontak Dosen & PJ Matkul
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Pusat Komunikasi Dosen dan PJ
          </p>
        </div>

        {isOfficer && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kontak</span>
          </motion.button>
        )}
      </div>

      {/* SINGLE-LINE SEARCH & FILTER CONTROLS */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        <div className="relative flex-1 hidden md:block">
          <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari matkul, dosen, atau PJ..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none"
          />
        </div>

        <div
          className={`block md:hidden transition-all duration-300 ease-in-out ${
            isMobileSearchExpanded ? 'flex-1' : 'w-10 shrink-0'
          }`}
        >
          {isMobileSearchExpanded ? (
            <div className="relative w-full flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kontak..."
                className="w-full pl-8 pr-8 py-2 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-blue-500/50 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none shadow-xs"
              />
              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchExpanded(false);
                  setSearch('');
                }}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsMobileSearchExpanded(true)}
              className={`w-10 h-9.5 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                search.trim() !== ''
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border-white/60 dark:border-white/10 text-slate-600 dark:text-zinc-300'
              }`}
              title="Cari Kontak"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {(!isMobileSearchExpanded ||
          typeof window === 'undefined' ||
          window.innerWidth >= 768) && (
          <div className="relative flex-1 md:flex-initial md:min-w-[220px]">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2 md:py-2.5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none font-semibold truncate appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Matkul ({contacts.length})</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* GRID DAFTAR KONTAK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {filteredContacts.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl text-slate-400 dark:text-zinc-500 text-xs shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            Tidak ada kontak ditemukan untuk pencarian atau filter saat ini.
          </div>
        ) : (
          <AnimatePresence>
            {filteredContacts.map((c: any) => {
              const nrps = parseTargetNrps(c.target_nrps || c.targetNrps);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={c.id}
                  className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none space-y-4 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100/50 dark:border-blue-900/40">
                            {c.code || 'Mata Kuliah'}{' '}
                            {c.sks ? `• ${c.sks} SKS` : ''}
                          </span>

                          {nrps && nrps.length > 0 && isOfficer && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/40">
                              Khusus ({nrps.length} NRP)
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 mt-2">
                          {c.course}
                        </h3>
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
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                            title="Edit Kontak"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteContact(c.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* DOSEN 1 */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-white/5 space-y-2.5">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 shrink-0">
                            Dosen{c.lecturerName2 ? ' 1' : ''}:
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {c.lecturerName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-0.5">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              openTemplate(
                                c.lecturerName,
                                c.lecturerPhone,
                                c.course
                              )
                            }
                            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>
                              Chat Dosen{c.lecturerName2 ? ' 1' : ''} (Pilih Template)
                            </span>
                          </motion.button>
                        </div>
                      </div>

                      {/* DOSEN 2 */}
                      {c.lecturerName2 && c.lecturerName2.trim() !== '' && (
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-white/5 space-y-2.5">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 shrink-0">
                              Dosen 2:
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                              {c.lecturerName2}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                openTemplate(
                                  c.lecturerName2,
                                  c.lecturerPhone2 || '',
                                  c.course
                                )
                              }
                              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Chat Dosen 2 (Pilih Template)</span>
                            </motion.button>
                          </div>
                        </div>
                      )}

                      {/* PJ MATKUL */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/40 dark:bg-zinc-800/30 border border-slate-200/40 dark:border-white/5 space-y-2.5">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 shrink-0">
                            PJ Matkul:
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {c.pjName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-0.5">
                          <motion.a
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            href={
                              formatWaNumber(c.pjPhone)
                                ? `https://wa.me/${formatWaNumber(c.pjPhone)}`
                                : '#'
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-zinc-700/60 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-800 dark:text-zinc-200 font-semibold text-xs transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Chat PJ Matkul</span>
                          </motion.a>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
              className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-200/40 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  {editingId
                    ? 'Edit Data Kontak Matkul'
                    : 'Tambah Kontak Matkul Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleSaveContact}
                className="flex flex-col flex-1 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Kode Matkul
                      </label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="DS234316"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Nama Mata Kuliah
                      </label>
                      <input
                        type="text"
                        required
                        value={formCourse}
                        onChange={(e) => setFormCourse(e.target.value)}
                        placeholder="Manusia dan Ruang Hidup"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* DOSEN 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Nama Dosen 1
                      </label>
                      <input
                        type="text"
                        required
                        value={formLecturerName}
                        onChange={(e) => setFormLecturerName(e.target.value)}
                        placeholder="Prof. Dr. Hendra, M.T."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        WhatsApp Dosen 1
                      </label>
                      <input
                        type="text"
                        required
                        value={formLecturerPhone}
                        onChange={(e) => setFormLecturerPhone(e.target.value)}
                        placeholder="081234567890"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* DOSEN 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Nama Dosen 2 (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formLecturerName2}
                        onChange={(e) => setFormLecturerName2(e.target.value)}
                        placeholder="Dr. Suprapto, M.Si."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        WhatsApp Dosen 2 (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formLecturerPhone2}
                        onChange={(e) => setFormLecturerPhone2(e.target.value)}
                        placeholder="081298765432"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Nama PJ Matkul
                      </label>
                      <input
                        type="text"
                        required
                        value={formPjName}
                        onChange={(e) => setFormPjName(e.target.value)}
                        placeholder="Dimas Ardiansyah"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        WhatsApp PJ Matkul
                      </label>
                      <input
                        type="text"
                        required
                        value={formPjPhone}
                        onChange={(e) => setFormPjPhone(e.target.value)}
                        placeholder="085712345678"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Ruang Perkuliahan
                      </label>
                      <input
                        type="text"
                        value={formRoom}
                        onChange={(e) => setFormRoom(e.target.value)}
                        placeholder="R. 301 Gedung Utama"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Jadwal Hari/Jam
                      </label>
                      <input
                        type="text"
                        value={formScheduleDayTime}
                        onChange={(e) => setFormScheduleDayTime(e.target.value)}
                        placeholder="Senin, 08:00 - 10:30 WIB"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        SKS
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={formSks}
                        onChange={(e) =>
                          setFormSks(
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        placeholder="3"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Link Presensi Khusus (Opsional)
                      </label>
                      <input
                        type="url"
                        value={formAttendanceUrl}
                        onChange={(e) => setFormAttendanceUrl(e.target.value)}
                        placeholder="https://mia.its.ac.id/presensi/ atau Google Form"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* FIELD TARGET NRP KHUSUS (TEXTAREA ENTER-ENTER) */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-white/5 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200">
                      Target NRP Khusus (Opsional)
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Kosongkan jika matkul ini untuk seluruh kelas. Tulis <strong>1 NRP per baris (tekan Enter)</strong> jika hanya untuk mahasiswa tertentu. Nama setelah NRP akan diabaikan secara otomatis.
                    </p>
                    <textarea
                      rows={4}
                      value={formTargetNrps}
                      onChange={(e) => setFormTargetNrps(e.target.value)}
                      placeholder={`5026211001\n5026211002 NARA\n5026211003`}
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    />
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4 border-t border-slate-200/40 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 bg-white/50 dark:bg-zinc-900/50">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Simpan Kontak
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Accordion Template Pesan Dosen */}
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
              className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-800 dark:text-zinc-100 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-slate-200/40 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-900/50">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Pilih Template Pesan WA ke Dosen..
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-3">
                {getLecturerTemplates().map((tmpl, idx) => {
                  const isOpen = openTemplateIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl bg-white/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-white/5 overflow-hidden transition-all"
                    >
                      <button
                        onClick={() =>
                          setOpenTemplateIndex(isOpen ? null : idx)
                        }
                        className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 hover:bg-white/80 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {tmpl.title}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="shrink-0 text-slate-400"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.25,
                              ease: [0.04, 0.62, 0.23, 0.98],
                            }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-1 space-y-3 border-t border-slate-200/40 dark:border-white/5">
                              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed italic bg-white/80 dark:bg-zinc-900/80 p-3 rounded-xl shadow-xs border border-slate-200/40 dark:border-white/5 whitespace-pre-line">
                                "{tmpl.msg}"
                              </p>

                              <motion.a
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                href={generateWaLink(
                                  templateTarget.phone,
                                  tmpl.msg
                                )}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setShowTemplateModal(false)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Kirim via WhatsApp</span>
                              </motion.a>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 sm:px-8 py-4 border-t border-slate-200/40 dark:border-white/10 flex items-center justify-end shrink-0 bg-white/50 dark:bg-zinc-900/50">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
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