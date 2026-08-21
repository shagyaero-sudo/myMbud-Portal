var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);

// src/data/mockData.ts
var initialAppState = {
  lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
  announcements: [],
  schedules: [],
  contacts: [],
  materials: [],
  tasks: [],
  groupResults: [],
  courseGrades: []
};

// server.ts
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DATA_FILE = import_path.default.join(DATA_DIR, "store.json");
var memoryStore = JSON.parse(JSON.stringify(initialAppState));
function getStoreData() {
  try {
    if (process.env.VERCEL) {
      return memoryStore;
    }
    if (!import_fs.default.existsSync(DATA_DIR) || !import_fs.default.existsSync(DATA_FILE)) {
      return memoryStore;
    }
    const raw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
    memoryStore = JSON.parse(raw);
    return memoryStore;
  } catch (err) {
    console.error("Error reading store data, using memory store:", err);
    return memoryStore;
  }
}
function saveStoreData(data) {
  try {
    data.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    memoryStore = data;
    if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    }
    return memoryStore;
  } catch (err) {
    console.error("Error saving store data, using memory store:", err);
    return memoryStore;
  }
}
var app = (0, import_express.default)();
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
async function setupLocalServer() {
  const PORT = Number(process.env.PORT) || 3e3;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
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
if (!process.env.VERCEL) {
  setupLocalServer();
}
var server_default = app;
//# sourceMappingURL=server.cjs.map
