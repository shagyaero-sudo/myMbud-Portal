export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'Penting' | 'Akademik' | 'Kegiatan' | 'Info';
  author: string;
  pinned: boolean;
}

export interface ScheduleItem {
  id: string;
  day: DayOfWeek;
  course: string;
  code: string;
  time: string;
  room: string;
  lecturer: string;
  lecturer2?: string;
  pjMatkul: string;
  sks: number;
  attendanceUrl?: string;
}

export interface Contact {
  id: string;
  course: string;
  code?: string;
  sks?: number;
  lecturerName: string;
  lecturerPhone: string;
  lecturerName2?: string;
  lecturerPhone2?: string;
  pjName: string;
  pjPhone: string;
  room?: string;
  scheduleDayTime?: string;
  attendanceUrl?: string;
  lecturers?: any[];
}

export interface MaterialFile {
  id: string;
  courseId: string;
  courseName: string;
  session: string; // e.g. "Pertemuan 1 - Pengantar", "Pertemuan 2"
  title: string;
  fileUrl: string;
  fileType: 'pdf' | 'ppt' | 'doc';
  fileSize: string;
  uploadDate: string;
  uploader: string;
  description?: string;
}

export interface TaskAttachment {
  fileName: string;
  fileUrl: string;
}

export interface Task {
  id: string;
  title: string;
  course: string;
  description: string;
  type: 'Individu' | 'Kelompok';
  assigner: string;
  deadline: string; // ISO String format
  status: 'todo' | 'in_progress' | 'done';
  priority: 'High' | 'Medium' | 'Low';
  classroomUrl?: string;
  /** @deprecated Gunakan `attachments`. Tetap ada untuk kompatibilitas data lama (1 lampiran). */
  attachment?: TaskAttachment;
  /** Lampiran tugas, bisa lebih dari satu (maks 5, diatur di UI). */
  attachments?: TaskAttachment[];
}

export interface GroupResult {
  id: string;
  title: string;
  createdAt: string;
  groupCount: number;
  groups: {
    name: string;
    members: string[];
  }[];
}

export interface GradeComponent {
  id: string;
  name: string;
  weight: number; // e.g. 20 for 20%
  score: number;  // 0 - 100
}

export interface CourseGrade {
  id: string;
  courseName: string;
  sks: number;
  components: GradeComponent[];
  targetGrade?: string;
}

export interface AppState {
  announcements: Announcement[];
  schedules: ScheduleItem[];
  contacts: Contact[];
  materials: MaterialFile[];
  tasks: Task[];
  groupResults: GroupResult[];
  courseGrades: CourseGrade[];
  lastUpdated: string;
}