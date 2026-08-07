import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initialAppState } from './src/data/mockData';
import { AppState, Task, Contact, MaterialFile, Announcement, ScheduleItem, GroupResult } from './src/types';

// Import OneSignal Notification Helper
import { sendOneSignalNotification } from './services/oneSignalServer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory and initial store file exist
function getStoreData(): AppState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialAppState, null, 2), 'utf-8');
      return initialAppState;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading store data:', err);
    return initialAppState;
  }
}

function saveStoreData(data: AppState): AppState {
  try {
    data.lastUpdated = new Date().toISOString();
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  } catch (err) {
    console.error('Error saving store data:', err);
    return data;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ============================================================
  // ONESIGNAL NOTIFICATION API (GENERAL)
  // ============================================================
  app.post('/api/notifications/send', async (req, res) => {
    try {
      const { targetNrp, title, message, url } = req.body;

      if (!targetNrp || !title || !message) {
        return res.status(400).json({
          success: false,
          error: 'targetNrp, title, dan message wajib diisi.',
        });
      }

      const result = await sendOneSignalNotification({
        targetNrp,
        title,
        message,
        url,
      });

      return res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error('[Notification API] Error:', error);

      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Gagal mengirim notifikasi.',
      });
    }
  });

  // ============================================================
  // ONESIGNAL NOTIFICATION API (MBUDIARY TRIGGER)
  // ============================================================
  app.post('/api/notifications/mbudiary', async (req, res) => {
    try {
      const { targetNrp, title, message, data } = req.body;

      if (!targetNrp || !title || !message) {
        return res.status(400).json({
          success: false,
          error: 'targetNrp, title, dan message wajib diisi.',
        });
      }

      const result = await sendOneSignalNotification({
        targetNrp,
        title,
        message,
        data,
      });

      return res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error('[Mbudiary Notification] Error:', error);

      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Gagal mengirim notifikasi Mbudiary.',
      });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get full app state
  app.get('/api/state', (_req, res) => {
    const store = getStoreData();
    res.json(store);
  });

  // Reset to initial mock state
  app.post('/api/reset', (_req, res) => {
    const fresh = saveStoreData(initialAppState);
    res.json({ success: true, data: fresh });
  });

  // Announcements API
  app.post('/api/announcements', (req, res) => {
    const store = getStoreData();
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: req.body.title || 'Pengumuman Baru',
      content: req.body.content || '',
      date: new Date().toISOString().split('T')[0],
      category: req.body.category || 'Info',
      author: req.body.author || 'Pengurus Kelas',
      pinned: !!req.body.pinned,
    };
    store.announcements.unshift(newAnn);
    saveStoreData(store);
    res.json({ success: true, announcement: newAnn, state: store });
  });

  app.delete('/api/announcements/:id', (req, res) => {
    const store = getStoreData();
    store.announcements = store.announcements.filter((a) => a.id !== req.params.id);
    saveStoreData(store);
    res.json({ success: true, state: store });
  });

  // Schedules API
  app.post('/api/schedules', (req, res) => {
    const store = getStoreData();
    const newItem: ScheduleItem = {
      id: `sch-${Date.now()}`,
      day: req.body.day || 'Senin',
      course: req.body.course || 'Mata Kuliah',
      code: req.body.code || 'MK101',
      time: req.body.time || '08:00 - 10:00 WIB',
      room: req.body.room || 'Ruang Kelas',
      lecturer: req.body.lecturer || 'Dosen Pengampu',
      pjMatkul: req.body.pjMatkul || 'PJ Matkul',
      sks: req.body.sks || 3,
    };
    store.schedules.push(newItem);
    saveStoreData(store);
    res.json({ success: true, schedule: newItem, state: store });
  });

  app.delete('/api/schedules/:id', (req, res) => {
    const store = getStoreData();
    store.schedules = store.schedules.filter((s) => s.id !== req.params.id);
    saveStoreData(store);
    res.json({ success: true, state: store });
  });

  // Contacts API
  app.post('/api/contacts', (req, res) => {
    const store = getStoreData();
    const newContact: Contact = {
      id: `cnt-${Date.now()}`,
      course: req.body.course,
      lecturerName: req.body.lecturerName,
      lecturerPhone: req.body.lecturerPhone,
      pjName: req.body.pjName,
      pjPhone: req.body.pjPhone,
      room: req.body.room || 'R. Kelas',
      scheduleDayTime: req.body.scheduleDayTime || '',
    };
    store.contacts.push(newContact);
    saveStoreData(store);
    res.json({ success: true, contact: newContact, state: store });
  });

  app.put('/api/contacts/:id', (req, res) => {
    const store = getStoreData();
    const index = store.contacts.findIndex((c) => c.id === req.params.id);
    if (index !== -1) {
      store.contacts[index] = { ...store.contacts[index], ...req.body };
      saveStoreData(store);
      res.json({ success: true, contact: store.contacts[index], state: store });
    } else {
      res.status(404).json({ error: 'Contact not found' });
    }
  });

  app.delete('/api/contacts/:id', (req, res) => {
    const store = getStoreData();
    store.contacts = store.contacts.filter((c) => c.id !== req.params.id);
    saveStoreData(store);
    res.json({ success: true, state: store });
  });

  // Materials / PDF API
  app.post('/api/materials', (req, res) => {
    const store = getStoreData();
    const newMat: MaterialFile = {
      id: `mat-${Date.now()}`,
      courseId: req.body.courseId || 'MK101',
      courseName: req.body.courseName || 'Mata Kuliah',
      session: req.body.session || 'Pertemuan 1',
      title: req.body.title || 'Materi Perkuliahan.pdf',
      fileUrl: req.body.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileType: req.body.fileType || 'pdf',
      fileSize: req.body.fileSize || '2.5 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      uploader: req.body.uploader || 'Pengurus Kelas A',
      description: req.body.description || '',
    };
    store.materials.unshift(newMat);
    saveStoreData(store);
    res.json({ success: true, material: newMat, state: store });
  });

  app.delete('/api/materials/:id', (req, res) => {
    const store = getStoreData();
    store.materials = store.materials.filter((m) => m.id !== req.params.id);
    saveStoreData(store);
    res.json({ success: true, state: store });
  });

  // Tasks API (Kanban)
  app.post('/api/tasks', (req, res) => {
    const store = getStoreData();
    const newTask: Task = {
      id: `tsk-${Date.now()}`,
      title: req.body.title,
      course: req.body.course,
      description: req.body.description || '',
      type: req.body.type || 'Individu',
      assigner: req.body.assigner || 'Dosen Pengampu',
      deadline: req.body.deadline,
      status: req.body.status || 'todo',
      priority: req.body.priority || 'Medium',
      classroomUrl: req.body.classroomUrl || '',
    };
    store.tasks.unshift(newTask);
    saveStoreData(store);
    res.json({ success: true, task: newTask, state: store });
  });

  app.put('/api/tasks/:id', (req, res) => {
    const store = getStoreData();
    const index = store.tasks.findIndex((t) => t.id === req.params.id);
    if (index !== -1) {
      store.tasks[index] = { ...store.tasks[index], ...req.body };
      saveStoreData(store);
      res.json({ success: true, task: store.tasks[index], state: store });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const store = getStoreData();
    store.tasks = store.tasks.filter((t) => t.id !== req.params.id);
    saveStoreData(store);
    res.json({ success: true, state: store });
  });

  // Save Group Generator Result
  app.post('/api/groups', (req, res) => {
    const store = getStoreData();
    const newGroupRes: GroupResult = {
      id: `grp-${Date.now()}`,
      title: req.body.title || 'Hasil Undian Kelompok',
      createdAt: new Date().toISOString().split('T')[0],
      groupCount: req.body.groups?.length || 0,
      groups: req.body.groups || [],
    };
    store.groupResults.unshift(newGroupRes);
    saveStoreData(store);
    res.json({ success: true, groupResult: newGroupRes, state: store });
  });

  // Vite development middleware or static serve in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server PaguyubAn running on http://0.0.0.0:${PORT}`);
  });
}

startServer();