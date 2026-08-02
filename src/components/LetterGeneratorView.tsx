import React, { useState } from 'react';
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import {
  FileText,
  Plus,
  Trash2,
  Send,
  Building2,
  MapPin,
  BookOpen,
  FileQuestion,
  Calendar,
  User,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  FileCheck2,
  Download,
} from 'lucide-react';

export interface GroupMember {
  no: number;
  nrp: string;
  nama: string;
  no_hp: string;
}

export const LetterGeneratorView: React.FC = () => {
  // Form Main Fields
  const [pimpinanInstansi, setPimpinanInstansi] = useState('');
  const [alamatInstansi, setAlamatInstansi] = useState('');
  const [mataKuliah, setMataKuliah] = useState('');
  const [temaWawancara, setTemaWawancara] = useState('');
  const [tanggalKegiatan, setTanggalKegiatan] = useState('');

  // Group Members Dynamic State
  const [members, setMembers] = useState<GroupMember[]>([
    { no: 1, nrp: '', nama: '', no_hp: '' },
  ]);

  // Success modal feedback state
  const [generatedData, setGeneratedData] = useState<any | null>(null);

  // Add Member handler
  const handleAddMember = () => {
    if (members.length < 10) {
      setMembers([...members, { no: members.length + 1, nrp: '', nama: '', no_hp: '' }]);
    }
  };

  // Remove Member handler
  const handleRemoveMember = (index: number) => {
    if (members.length > 1) {
      const updated = members.filter((_, i) => i !== index);
      // Re-calculate the "no" for the table array
      const renumbered = updated.map((m, i) => ({ ...m, no: i + 1 }));
      setMembers(renumbered);
    }
  };

  // Update Member field handler
  const handleMemberChange = (
    index: number,
    field: keyof GroupMember,
    value: string
  ) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  // Submit / Generate handler
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    // Mengambil waktu saat ini dan memformat ke gaya bahasa Indonesia
    const tanggalHariIni = new Date();
    const formatTanggal = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(tanggalHariIni);

    const payload = {
      pimpinan_instansi: pimpinanInstansi,
      alamat_instansi: alamatInstansi,
      mata_kuliah: mataKuliah,
      tema_wawancara: temaWawancara,
      tanggal_kegiatan: tanggalKegiatan,
      mahasiswa: members,
      tanggal_surat: formatTanggal, // Tanggal otomatis disisipkan ke sini
    };

    setGeneratedData(payload);
  };

  const handleDownloadDocx = async () => {
    if (!generatedData) return;

    try {
      // Mengambil template dari folder public
      const response = await fetch("/surat_Pengantar.docx"); 
      if (!response.ok) throw new Error("Template surat_Pengantar.docx tidak ditemukan di folder public");
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
  
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
  
      // Mengisi dokumen dengan data dari form
      doc.render(generatedData);
  
      // Menyimpan dokumen dengan nama file baru sesuai permintaan
      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      
      const namaFile = `Surat_Pengantar_Wawancara_${(generatedData.pimpinan_instansi || 'TU').replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      saveAs(out, namaFile);
  
    } catch (error) {
      console.error("Gagal mencetak surat:", error);
      alert("Gagal mencetak surat! Pastikan file surat_Pengantar.docx ada di folder public.");
    }
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-32 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Ajukan Surat Turlap
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Buat draft surat turlap secara otomatis di sini!
            </p>
          </div>
        </div>
      </div>

      {/* Unified Form Container (Single Bubble Utama) */}
      <form
        onSubmit={handleGenerate}
        className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] dark:shadow-none space-y-6 transition-colors"
      >
        {/* Section 1: Detail Instansi & Kegiatan */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
              1. Detail Instansi & Kegiatan
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pimpinan / Instansi Tujuan */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Pimpinan / Instansi Tujuan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={pimpinanInstansi}
                  onChange={(e) => setPimpinanInstansi(e.target.value)}
                  placeholder="Misal: Pimpinan Desa Gebang Putih"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Alamat Instansi */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Alamat Instansi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <textarea
                  rows={2}
                  required
                  value={alamatInstansi}
                  onChange={(e) => setAlamatInstansi(e.target.value)}
                  placeholder="Misal: Jl. Gebang Putih No. 5, Gebang Putih, Kec. Sukolilo Surabaya"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Mata Kuliah */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Mata Kuliah <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={mataKuliah}
                  onChange={(e) => setMataKuliah(e.target.value)}
                  placeholder="Misal: Sosiologi Pembangunan"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Tanggal Pelaksanaan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Tanggal Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={tanggalKegiatan}
                  onChange={(e) => setTanggalKegiatan(e.target.value)}
                  placeholder="Misal: 12 - 22 Juni 2026"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Tema Wawancara/Survey */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Tema Wawancara / Survey <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileQuestion className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={temaWawancara}
                  onChange={(e) => setTemaWawancara(e.target.value)}
                  placeholder="Misal: Pembangunan di bidang Pendidikan"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Daftar Anggota Kelompok */}
        <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                2. Daftar Anggota Kelompok
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
              {members.length} Anggota
            </span>
          </div>

          <div className="space-y-3">
            {members.map((member, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/80 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3 transition-all"
              >
                <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 sm:hidden">
                    {index === 0 ? 'Ketua / Anggota 1' : `Anggota ${index + 1}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                  {/* NRP Input */}
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={member.nrp}
                      onChange={(e) =>
                        handleMemberChange(index, 'nrp', e.target.value)
                      }
                      placeholder="NRP (Misal: 5033251067)"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Nama Input */}
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={member.nama}
                      onChange={(e) =>
                        handleMemberChange(index, 'nama', e.target.value)
                      }
                      placeholder="Nama (Misal: Bintang Rafi)"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* No HP Input */}
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={member.no_hp}
                      onChange={(e) =>
                        handleMemberChange(index, 'no_hp', e.target.value)
                      }
                      placeholder="No. HP (Misal: 0851822...)"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Delete Button */}
                <div className="flex justify-end sm:justify-start shrink-0">
                  <button
                    type="button"
                    disabled={index === 0 && members.length === 1}
                    onClick={() => handleRemoveMember(index)}
                    title={
                      index === 0 && members.length === 1
                        ? 'Minimal harus ada 1 anggota'
                        : 'Hapus Anggota'
                    }
                    className={`p-2 rounded-xl transition-all ${
                      index === 0 && members.length === 1
                        ? 'text-slate-300 dark:text-zinc-700 cursor-not-allowed'
                        : 'text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={members.length >= 10}
              onClick={handleAddMember}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                members.length >= 10
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 border-slate-200 dark:border-zinc-800 cursor-not-allowed'
                  : 'bg-slate-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50/80 dark:hover:bg-blue-900/40'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Anggota</span>
            </button>
          </div>
        </div>

        {/* Section 3: Submit Action Button */}
        <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Pastikan seluruh data terisi dengan benar sesuai data permohonan.
            </span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Buat Surat (.docx)</span>
          </button>
        </div>
      </form>

      {/* Card Pusat Tautan TU: Langkah Selanjutnya */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 transition-colors">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ArrowRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Langkah Selanjutnya
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Pastikan Anda sudah mengunduh 'Hasil Surat docx.' sebelum melanjutkan.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <a
            href="https://its.id/usulansuratpengantar"
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all text-center"
          >
            <Send className="w-4 h-4" />
            <span>Kirim File Surat ke TU</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          <a
            href="https://its.id/hasilsuratsp"
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold transition-all text-center"
          >
            <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Cek Hasil Pengesahan TU</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic pt-1">
          *Catatan: Hasil pengesahan surat dari TU biasanya memerlukan waktu proses 1-2 hari kerja.
        </p>
      </div>

      {/* Result Modal / Preview Card */}
      {generatedData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Data Surat Berhasil Dibuat
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 space-y-1.5 border border-slate-100 dark:border-zinc-800">
                <p className="font-semibold text-slate-700 dark:text-zinc-300">
                  Instansi Tujuan:
                </p>
                <p className="text-slate-900 dark:text-zinc-100 font-bold">
                  {generatedData.pimpinan_instansi}
                </p>
                <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
                  {generatedData.alamat_instansi}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
                  <span className="text-slate-400 dark:text-zinc-500 block">Mata Kuliah</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {generatedData.mata_kuliah}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
                  <span className="text-slate-400 dark:text-zinc-500 block">Tanggal Kegiatan</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {generatedData.tanggal_kegiatan}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">Tema Wawancara</span>
                <p className="font-medium text-slate-800 dark:text-zinc-200">
                  {generatedData.tema_wawancara}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 dark:text-zinc-400 font-semibold text-[11px]">
                  Anggota Kelompok ({generatedData.mahasiswa.length}):
                </span>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-[11px] overflow-x-auto space-y-1.5 max-h-36">
                  {generatedData.mahasiswa.map(
                    (m: GroupMember, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-slate-800 dark:text-zinc-200 border-b border-slate-200/60 dark:border-zinc-700/60 pb-1.5 last:border-0">
                        <span className="font-medium">{m.no}. {m.nama || '-'} <span className="text-slate-500 dark:text-zinc-400 font-normal">({m.nrp || '-'})</span></span>
                        <span className="text-slate-500 dark:text-zinc-400 shrink-0">{m.no_hp || '-'}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Primary Action: Download Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadDocx}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Hasil Surat (.docx)</span>
              </button>
            </div>

            {/* Instruction Text */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-zinc-800/60 border border-blue-100/80 dark:border-zinc-700/60 text-center">
              <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 leading-relaxed">
                Silakan unduh draft surat melalui tombol di atas. Setelah selesai, tutup jendela ini dan lanjutkan ke step 'Kirim File Surat ke TU' ya!
              </p>
            </div>

            {/* Secondary Action: Close Button */}
            <div>
              <button
                type="button"
                onClick={() => setGeneratedData(null)}
                className="w-full py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-xs font-semibold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};