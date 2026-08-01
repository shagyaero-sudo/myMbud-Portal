import { Task } from '../types';

export function downloadIcsFile(task: Task) {
  const startDate = new Date(task.deadline);
  // Default duration 1 hour before deadline
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//myMbud//Kelas A Task Tracker//ID',
    'BEGIN:VEVENT',
    `UID:task-${task.id}@mymbud.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:[DEADLINE ${task.course}] ${task.title}`,
    `DESCRIPTION:${task.description.replace(/\n/g, ' ')} \\n\\nPemberi Tugas: ${task.assigner}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Deadline_${task.course}_${task.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(task: Task): string {
  const startDate = new Date(task.deadline);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const title = encodeURIComponent(`[DEADLINE ${task.course}] ${task.title}`);
  const details = encodeURIComponent(
    `Tugas ${task.type} - Mata Kuliah: ${task.course}\nDeskripsi: ${task.description}\nPemberi Tugas: ${task.assigner}`
  );
  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
}
