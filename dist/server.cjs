var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_url = require("url");
var import_vite = require("vite");

// src/data/mockData.ts
var initialAppState = {
  lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
  announcements: [
    {
      id: "ann-1",
      title: "\u{1F4CC} Perubahan Jam Kuliah Perencanaan Wilayah minggu ini",
      content: "Bapak Prof. Dr. Hendra menyampaikan bahwa perkuliahan Perencanaan Wilayah pada hari Selasa dipindah dari pukul 08.00 WIB menjadi pukul 10.00 WIB di Ruang A.204.",
      date: "2026-07-29",
      category: "Penting",
      author: "Ahmad Fauzi (Ketua Kelas A)",
      pinned: true
    },
    {
      id: "ann-2",
      title: "\u{1F4C4} Pengumpulan Proposal Penelitian Metodologi Penelitian",
      content: "Batas akhir pengumpulan draft bab 1-3 proposal penelitian kelompok adalah Jumat ini pukul 23.59 WIB di Google Classroom & Bank Materi myMbud.",
      date: "2026-07-28",
      category: "Akademik",
      author: "Siti Nurhaliza (PJ Metpen)",
      pinned: true
    },
    {
      id: "ann-3",
      title: "\u{1F389} Agenda Makrab & Study Tour Kelas A Semester Ini",
      content: "Teman-teman Kelas A! Hasil voting pengurus menaruh acara Makrab di Lembang tanggal 15-16 Agustus. Mohon konfirmasi kehadiran ke Bendahara Kelas.",
      date: "2026-07-25",
      category: "Kegiatan",
      author: "Pengurus Kelas A",
      pinned: false
    }
  ],
  schedules: [
    {
      id: "sch-1",
      day: "Senin",
      course: "Manusia dan Ruang Hidup",
      code: "DS234316",
      time: "08:00 - 10:30 WIB",
      room: "R. 301 Gedung Utama",
      lecturer: "Dr. Rina Wulandari, M.Si.",
      pjMatkul: "Budi Santoso",
      sks: 3
    },
    {
      id: "sch-2",
      day: "Senin",
      course: "Statistik Sosial",
      code: "DS234317",
      time: "13:00 - 14:40 WIB",
      room: "R. Lab Komputer 2",
      lecturer: "Prof. Drs. Bambang Utomo, Ph.D.",
      pjMatkul: "Citra Dewi",
      sks: 2
    },
    {
      id: "sch-3",
      day: "Selasa",
      course: "Gender dan Pembangunan",
      code: "DS234318",
      time: "08:00 - 10:30 WIB",
      room: "R. A.204 Gedung B",
      lecturer: "Prof. Dr. Hendra Wijaya, S.T., M.T.",
      pjMatkul: "Dimas Ardiansyah",
      sks: 3
    },
    {
      id: "sch-4",
      day: "Selasa",
      course: "Infrastruktur Pembangunan",
      code: "DS234319",
      time: "13:00 - 15:30 WIB",
      room: "R. Auditorium Lt. 2",
      lecturer: "Dr. Hj. Sri Wahyuni, M.Hum.",
      pjMatkul: "Siti Nurhaliza",
      sks: 3
    },
    {
      id: "sch-5",
      day: "Rabu",
      course: "Ekonomi Makro",
      code: "DS234320",
      time: "08:00 - 09:40 WIB",
      room: "R. Lab Statistika",
      lecturer: "Ir. Muhammad Rizky, M.Sc.",
      pjMatkul: "Eko Prasetyo",
      sks: 2
    },
    {
      id: "sch-6",
      day: "Rabu",
      course: "Komunikasi Pembangunan",
      code: "DS234321",
      time: "10:00 - 11:40 WIB",
      room: "R. Seminar 1",
      lecturer: "Drs. Agus Supriyanto, M.AP.",
      pjMatkul: "Fina Rahmawati",
      sks: 2
    },
    {
      id: "sch-7",
      day: "Kamis",
      course: "Kebijakan Publik dan Pembangunan",
      code: "DS234322",
      time: "08:00 - 09:40 WIB",
      room: "R. 302 Gedung Utama",
      lecturer: "Dr. Ir. Hj. Endang Rahayu, M.Si.",
      pjMatkul: "Gita Gutawa",
      sks: 2
    },
    {
      id: "sch-8",
      day: "Kamis",
      course: "Etika Pembangunan",
      code: "DS234323",
      time: "10:00 - 11:40 WIB",
      room: "R. A.205 Gedung B",
      lecturer: "Prof. Drs. Heru Prasetyo, Ph.D.",
      pjMatkul: "Hadi Sucipto",
      sks: 2
    },
    {
      id: "sch-9",
      day: "Jumat",
      course: "Dasar-dasar Manajemen",
      code: "DS234324",
      time: "08:00 - 09:40 WIB",
      room: "R. Auditorium Lt. 3",
      lecturer: "Dr. Tri Kusuma, S.E., M.M.",
      pjMatkul: "Indah Permata",
      sks: 2
    }
  ],
  contacts: [
    {
      id: "cnt-1",
      course: "Manusia dan Ruang Hidup",
      code: "DS234316",
      lecturerName: "Dr. Rina Wulandari, M.Si.",
      lecturerPhone: "08112345678",
      pjName: "Budi Santoso",
      pjPhone: "081234567890",
      room: "R. 301 Gedung Utama",
      scheduleDayTime: "Senin, 08:00 - 10:30 WIB"
    },
    {
      id: "cnt-2",
      course: "Statistik Sosial",
      code: "DS234317",
      lecturerName: "Prof. Drs. Bambang Utomo, Ph.D.",
      lecturerPhone: "08129876543",
      pjName: "Citra Dewi",
      pjPhone: "082198765432",
      room: "R. Lab Komputer 2",
      scheduleDayTime: "Senin, 13:00 - 14:40 WIB"
    },
    {
      id: "cnt-3",
      course: "Gender dan Pembangunan",
      code: "DS234318",
      lecturerName: "Prof. Dr. Hendra Wijaya, S.T., M.T.",
      lecturerPhone: "08138877665",
      pjName: "Dimas Ardiansyah",
      pjPhone: "085712345678",
      room: "R. A.204 Gedung B",
      scheduleDayTime: "Selasa, 08:00 - 10:30 WIB"
    },
    {
      id: "cnt-4",
      course: "Infrastruktur Pembangunan",
      code: "DS234319",
      lecturerName: "Dr. Hj. Sri Wahyuni, M.Hum.",
      lecturerPhone: "08154433221",
      pjName: "Siti Nurhaliza",
      pjPhone: "081399887766",
      room: "R. Auditorium Lt. 2",
      scheduleDayTime: "Selasa, 13:00 - 15:30 WIB"
    },
    {
      id: "cnt-5",
      course: "Ekonomi Makro",
      code: "DS234320",
      lecturerName: "Ir. Muhammad Rizky, M.Sc.",
      lecturerPhone: "08176655443",
      pjName: "Eko Prasetyo",
      pjPhone: "087811223344",
      room: "R. Lab Statistika",
      scheduleDayTime: "Rabu, 08:00 - 09:40 WIB"
    },
    {
      id: "cnt-6",
      course: "Komunikasi Pembangunan",
      code: "DS234321",
      lecturerName: "Drs. Agus Supriyanto, M.AP.",
      lecturerPhone: "08182233445",
      pjName: "Fina Rahmawati",
      pjPhone: "089655443322",
      room: "R. Seminar 1",
      scheduleDayTime: "Rabu, 10:00 - 11:40 WIB"
    },
    {
      id: "cnt-7",
      course: "Kebijakan Publik dan Pembangunan",
      code: "DS234322",
      lecturerName: "Dr. Ir. Hj. Endang Rahayu, M.Si.",
      lecturerPhone: "08193344556",
      pjName: "Gita Gutawa",
      pjPhone: "081211223344",
      room: "R. 302 Gedung Utama",
      scheduleDayTime: "Kamis, 08:00 - 09:40 WIB"
    },
    {
      id: "cnt-8",
      course: "Etika Pembangunan",
      code: "DS234323",
      lecturerName: "Prof. Drs. Heru Prasetyo, Ph.D.",
      lecturerPhone: "08127788990",
      lecturers: [
        { nama: "Prof. Drs. Heru Prasetyo, Ph.D.", startWeek: 1, endWeek: 8, no_wa: "08127788990" },
        { nama: "Dr. Farida Nur, M.Phil.", startWeek: 9, endWeek: 16, no_wa: "08124455667" }
      ],
      pjName: "Hadi Sucipto",
      pjPhone: "085611223344",
      room: "R. A.205 Gedung B",
      scheduleDayTime: "Kamis, 10:00 - 11:40 WIB"
    },
    {
      id: "cnt-9",
      course: "Dasar-dasar Manajemen",
      code: "DS234324",
      lecturerName: "Dr. Tri Kusuma, S.E., M.M.",
      lecturerPhone: "08135566778",
      lecturers: [
        { nama: "Dr. Tri Kusuma, S.E., M.M.", startWeek: 1, endWeek: 8, no_wa: "08135566778" },
        { nama: "Ir. Agung Santoso, M.M.", startWeek: 9, endWeek: 16, no_wa: "08132211009" }
      ],
      pjName: "Indah Permata",
      pjPhone: "081399001122",
      room: "R. Auditorium Lt. 3",
      scheduleDayTime: "Jumat, 08:00 - 09:40 WIB"
    }
  ],
  materials: [
    {
      id: "mat-1",
      courseId: "DS234316",
      courseName: "Manusia dan Ruang Hidup",
      session: "Pertemuan 1",
      title: "Pengantar Konsep Manusia dan Ruang Hidup.pdf",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileType: "pdf",
      fileSize: "2.4 MB",
      uploadDate: "2026-07-15",
      uploader: "Dr. Rina Wulandari, M.Si.",
      description: "Slide presentasi pengantar ekologi manusia, ruang interaksi sosial, dan ruang hidup."
    },
    {
      id: "mat-2",
      courseId: "DS234317",
      courseName: "Statistik Sosial",
      session: "Pertemuan 1",
      title: "Dasar-dasar Analisis Statistik Sosial & SPSS.pdf",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileType: "pdf",
      fileSize: "3.1 MB",
      uploadDate: "2026-07-22",
      uploader: "Prof. Drs. Bambang Utomo, Ph.D.",
      description: "Pengenalan variabel statistik sosial, distribusi frekuensi, dan pengolahan data SPSS."
    },
    {
      id: "mat-3",
      courseId: "DS234318",
      courseName: "Gender dan Pembangunan",
      session: "Pertemuan 1",
      title: "Perspektif Gender dalam Kebijakan Pembangunan.pdf",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileType: "pdf",
      fileSize: "4.8 MB",
      uploadDate: "2026-07-16",
      uploader: "Prof. Dr. Hendra Wijaya",
      description: "Materi pedoman analisis gender, kesetaraan sosial, dan pemberdayaan masyarakat."
    },
    {
      id: "mat-4",
      courseId: "DS234319",
      courseName: "Infrastruktur Pembangunan",
      session: "Pertemuan 1",
      title: "Sistem Infrastruktur Publik & Perencanaan Wilayah.pdf",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileType: "pdf",
      fileSize: "1.9 MB",
      uploadDate: "2026-07-23",
      uploader: "Siti Nurhaliza (PJ)",
      description: "Panduan teknis perencanaan jalan, sanitasi, energi, dan fasilitas publik."
    }
  ],
  tasks: [
    {
      id: "tsk-1",
      title: "Draft Bab 1-3 Proposal Infrastruktur Pembangunan",
      course: "Infrastruktur Pembangunan",
      description: "Membuat latar belakang, rumusan masalah, dan analisis kebutuhan infrastruktur publik min. 15 referensi.",
      type: "Kelompok",
      assigner: "Dr. Hj. Sri Wahyuni, M.Hum.",
      deadline: new Date(Date.now() + 1.5 * 24 * 3600 * 1e3).toISOString(),
      status: "in_progress",
      priority: "High",
      attachment: {
        fileName: "Panduan_Tugas_Proposal_Infrastruktur.pdf",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      }
    },
    {
      id: "tsk-2",
      title: "Analisis Peta Spasial Manusia & Ruang Hidup",
      course: "Manusia dan Ruang Hidup",
      description: "Hitung pola pemanfaatan ruang dan interaksi sosial masyarakat kota berdasarkan data BPS.",
      type: "Individu",
      assigner: "Dr. Rina Wulandari, M.Si.",
      deadline: new Date(Date.now() + 3.5 * 24 * 3600 * 1e3).toISOString(),
      status: "todo",
      priority: "High"
    },
    {
      id: "tsk-3",
      title: "Review Jurnal Gender dan Pembangunan Masyarakat",
      course: "Gender dan Pembangunan",
      description: "Ringkasan artikel 3 halaman A4 spasi 1.15 memuat metodologi, temuan, dan masukan kebijakan.",
      type: "Individu",
      assigner: "Prof. Dr. Hendra Wijaya, S.T., M.T.",
      deadline: new Date(Date.now() + 6 * 24 * 3600 * 1e3).toISOString(),
      status: "todo",
      priority: "Medium",
      attachment: {
        fileName: "Template_Format_Review_Jurnal.pdf",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      }
    },
    {
      id: "tsk-4",
      title: "Olah Data SPSS Statistik Sosial Regresi",
      course: "Statistik Sosial",
      description: "Pengolahan dataset survei dengan output SPSS beserta interpretasi uji hipotesis.",
      type: "Individu",
      assigner: "Prof. Drs. Bambang Utomo, Ph.D.",
      deadline: new Date(Date.now() - 1.5 * 24 * 3600 * 1e3).toISOString(),
      status: "done",
      priority: "Medium"
    },
    {
      id: "tsk-5",
      title: "Makalah Kebijakan Publik dan Pembangunan Sektor Pendidikan",
      course: "Kebijakan Publik dan Pembangunan",
      description: "Analisis efektivitas kebijakan zonasi dan bantuan pendidikan daerah.",
      type: "Kelompok",
      assigner: "Dr. Ir. Hj. Endang Rahayu, M.Si.",
      deadline: new Date(Date.now() + 10 * 24 * 3600 * 1e3).toISOString(),
      status: "todo",
      priority: "Low"
    },
    {
      id: "tsk-6",
      title: "Laporan Pemetaan Kebutuhan Ruang Terbuka Hijau",
      course: "Manusia dan Ruang Hidup",
      description: "Dokumen kajian lapangan dan pemetaan spasial RTH kawasan perkotaan Surabaya.",
      type: "Kelompok",
      assigner: "Dr. Rina Wulandari, M.Si.",
      deadline: new Date(Date.now() - 4.5 * 24 * 3600 * 1e3).toISOString(),
      status: "done",
      priority: "High",
      attachment: {
        fileName: "Laporan_RTH_Final_Kelompok2.pdf",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      }
    },
    {
      id: "tsk-7",
      title: "Essai Kritis Gender & Ketimpangan Akses Pendidikan",
      course: "Gender dan Pembangunan",
      description: "Kajian studi kasus berbasis literatur 5 halaman A4 mengenai ketimpangan partisipasi gender.",
      type: "Individu",
      assigner: "Prof. Dr. Hendra Wijaya, S.T., M.T.",
      deadline: new Date(Date.now() - 8 * 24 * 3600 * 1e3).toISOString(),
      status: "done",
      priority: "Medium"
    }
  ],
  groupResults: [
    {
      id: "grp-1",
      title: "Kelompok Presentasi Metodologi Penelitian",
      createdAt: "2026-07-20",
      groupCount: 4,
      groups: [
        { name: "Kelompok 1", members: ["Ahmad Fauzi", "Budi Santoso", "Citra Dewi", "Dimas Ardiansyah"] },
        { name: "Kelompok 2", members: ["Eko Prasetyo", "Fina Rahmawati", "Gita Gutawa", "Hadi Sucipto"] },
        { name: "Kelompok 3", members: ["Indah Permata", "Joko Widodo", "Kartika Sari", "Luki Wijaya"] },
        { name: "Kelompok 4", members: ["Mita Anggraini", "Naufal Pratama", "Olivia Jensen", "Putra Utama"] }
      ]
    }
  ],
  courseGrades: [
    {
      id: "grd-1",
      courseName: "Manusia dan Ruang Hidup",
      sks: 3,
      targetGrade: "A",
      components: [
        { id: "c1", name: "Tugas Individu & Mandiri", weight: 20, score: 88 },
        { id: "c2", name: "Tugas Kelompok & Presentasi", weight: 20, score: 90 },
        { id: "c3", name: "Kuis & Kehadiran", weight: 10, score: 95 },
        { id: "c4", name: "UTS (Ujian Tengah Semester)", weight: 25, score: 84 },
        { id: "c5", name: "UAS (Ujian Akhir Semester)", weight: 25, score: 86 }
      ]
    },
    {
      id: "grd-2",
      courseName: "Statistik Sosial",
      sks: 2,
      targetGrade: "A",
      components: [
        { id: "c1", name: "Tugas Olah Data SPSS", weight: 25, score: 85 },
        { id: "c2", name: "Kuis Statistika", weight: 15, score: 80 },
        { id: "c3", name: "UTS", weight: 30, score: 82 },
        { id: "c4", name: "UAS", weight: 30, score: 88 }
      ]
    },
    {
      id: "grd-3",
      courseName: "Infrastruktur Pembangunan",
      sks: 3,
      targetGrade: "A",
      components: [
        { id: "c1", name: "Proposal Lapangan", weight: 30, score: 92 },
        { id: "c2", name: "Kuis & Partisipasi", weight: 10, score: 90 },
        { id: "c3", name: "UTS", weight: 30, score: 85 },
        { id: "c4", name: "UAS", weight: 30, score: 89 }
      ]
    }
  ]
};

// server.ts
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var DATA_DIR = import_path.default.join(__dirname, "data");
var DATA_FILE = import_path.default.join(DATA_DIR, "store.json");
function getStoreData() {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!import_fs.default.existsSync(DATA_FILE)) {
      import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(initialAppState, null, 2), "utf-8");
      return initialAppState;
    }
    const raw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading store data:", err);
    return initialAppState;
  }
}
function saveStoreData(data) {
  try {
    data.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return data;
  } catch (err) {
    console.error("Error saving store data:", err);
    return data;
  }
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/state", (_req, res) => {
    const store = getStoreData();
    res.json(store);
  });
  app.post("/api/reset", (_req, res) => {
    const fresh = saveStoreData(initialAppState);
    res.json({ success: true, data: fresh });
  });
  app.post("/api/announcements", (req, res) => {
    const store = getStoreData();
    const newAnn = {
      id: `ann-${Date.now()}`,
      title: req.body.title || "Pengumuman Baru",
      content: req.body.content || "",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      category: req.body.category || "Info",
      author: req.body.author || "Pengurus Kelas",
      pinned: !!req.body.pinned
    };
    store.announcements.unshift(newAnn);
    saveStoreData(store);
    res.json({ success: true, announcement: newAnn, state: store });
  });
  app.delete("/api/announcements/:id", (req, res) => {
    const store = getStoreData();
    store.announcements = store.announcements.filter((a) => a.id !== req.params.id);
    saveStoreData(store);
    res.json({ success: true, state: store });
  });
  app.post("/api/schedules", (req, res) => {
    const store = getStoreData();
    const newItem = {
      id: `sch-${Date.now()}`,
      day: req.body.day || "Senin",
      course: req.body.course || "Mata Kuliah",
      code: req.body.code || "MK101",
      time: req.body.time || "08:00 - 10:00 WIB",
      room: req.body.room || "Ruang Kelas",
      lecturer: req.body.lecturer || "Dosen Pengampu",
      pjMatkul: req.body.pjMatkul || "PJ Matkul",
      sks: req.body.sks || 3
    };
    store.schedules.push(newItem);
    saveStoreData(store);
    res.json({ success: true, schedule: newItem, state: store });
  });
  app.delete("/api/schedules/:id", (req, res) => {
    const store = getStoreData();
    store.schedules = store.schedules.filter((s) => s.id !== req.params.id);
    saveStoreData(store);
    res.json({ success: true, state: store });
  });
  app.post("/api/contacts", (req, res) => {
    const store = getStoreData();
    const newContact = {
      id: `cnt-${Date.now()}`,
      course: req.body.course,
      lecturerName: req.body.lecturerName,
      lecturerPhone: req.body.lecturerPhone,
      pjName: req.body.pjName,
      pjPhone: req.body.pjPhone,
      room: req.body.room || "R. Kelas",
      scheduleDayTime: req.body.scheduleDayTime || ""
    };
    store.contacts.push(newContact);
    saveStoreData(store);
    res.json({ success: true, contact: newContact, state: store });
  });
  app.put("/api/contacts/:id", (req, res) => {
    const store = getStoreData();
    const index = store.contacts.findIndex((c) => c.id === req.params.id);
    if (index !== -1) {
      store.contacts[index] = { ...store.contacts[index], ...req.body };
      saveStoreData(store);
      res.json({ success: true, contact: store.contacts[index], state: store });
    } else {
      res.status(404).json({ error: "Contact not found" });
    }
  });
  app.delete("/api/contacts/:id", (req, res) => {
    const store = getStoreData();
    store.contacts = store.contacts.filter((c) => c.id !== req.params.id);
    saveStoreData(store);
    res.json({ success: true, state: store });
  });
  app.post("/api/materials", (req, res) => {
    const store = getStoreData();
    const newMat = {
      id: `mat-${Date.now()}`,
      courseId: req.body.courseId || "MK101",
      courseName: req.body.courseName || "Mata Kuliah",
      session: req.body.session || "Pertemuan 1",
      title: req.body.title || "Materi Perkuliahan.pdf",
      fileUrl: req.body.fileUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileType: req.body.fileType || "pdf",
      fileSize: req.body.fileSize || "2.5 MB",
      uploadDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      uploader: req.body.uploader || "Pengurus Kelas A",
      description: req.body.description || ""
    };
    store.materials.unshift(newMat);
    saveStoreData(store);
    res.json({ success: true, material: newMat, state: store });
  });
  app.delete("/api/materials/:id", (req, res) => {
    const store = getStoreData();
    store.materials = store.materials.filter((m) => m.id !== req.params.id);
    saveStoreData(store);
    res.json({ success: true, state: store });
  });
  app.post("/api/tasks", (req, res) => {
    const store = getStoreData();
    const newTask = {
      id: `tsk-${Date.now()}`,
      title: req.body.title,
      course: req.body.course,
      description: req.body.description || "",
      type: req.body.type || "Individu",
      assigner: req.body.assigner || "Dosen Pengampu",
      deadline: req.body.deadline,
      status: req.body.status || "todo",
      priority: req.body.priority || "Medium",
      classroomUrl: req.body.classroomUrl || ""
    };
    store.tasks.unshift(newTask);
    saveStoreData(store);
    res.json({ success: true, task: newTask, state: store });
  });
  app.put("/api/tasks/:id", (req, res) => {
    const store = getStoreData();
    const index = store.tasks.findIndex((t) => t.id === req.params.id);
    if (index !== -1) {
      store.tasks[index] = { ...store.tasks[index], ...req.body };
      saveStoreData(store);
      res.json({ success: true, task: store.tasks[index], state: store });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  });
  app.delete("/api/tasks/:id", (req, res) => {
    const store = getStoreData();
    store.tasks = store.tasks.filter((t) => t.id !== req.params.id);
    saveStoreData(store);
    res.json({ success: true, state: store });
  });
  app.post("/api/groups", (req, res) => {
    const store = getStoreData();
    const newGroupRes = {
      id: `grp-${Date.now()}`,
      title: req.body.title || "Hasil Undian Kelompok",
      createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      groupCount: req.body.groups?.length || 0,
      groups: req.body.groups || []
    };
    store.groupResults.unshift(newGroupRes);
    saveStoreData(store);
    res.json({ success: true, groupResult: newGroupRes, state: store });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server PaguyubAn running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
