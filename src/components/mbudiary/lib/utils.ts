/**
 * Formats date to 'HH.mm, D MMM YYYY' format (e.g. "14.20, 6 Agt 2026")
 * and provides relative time (e.g. "2m lalu")
 */

const MONTHS_ID = [
  'Agt', 'Agt', 'Agt', 'Agt', 'Agt', 'Agt', 'Agt', 'Agt', 'Agt', 'Agt', 'Agt', 'Agt'
];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatDateFormatted(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Baru saja';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return `${hours}.${minutes}, ${day} ${month} ${year}`;
}

export function formatTimeAgo(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Baru saja';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'Baru saja';
  if (diffInSeconds < 60) return `${diffInSeconds}dt lalu`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m lalu`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}j lalu`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}h lalu`;

  return formatDateFormatted(date);
}

export function formatPostTimestamp(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Baru saja';

  const now = new Date();
  const isSameDay = 
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}.${minutes}`;

  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const dateStr = `${day} ${month} ${year}`;

  if (isSameDay) {
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let relativeStr = 'Baru saja';
    if (diffInSeconds < 30) {
      relativeStr = 'Baru saja';
    } else if (diffInSeconds < 60) {
      relativeStr = `${diffInSeconds}dt lalu`;
    } else {
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        relativeStr = `${diffInMinutes}m lalu`;
      } else {
        const diffInHours = Math.floor(diffInMinutes / 60);
        relativeStr = `${diffInHours}j lalu`;
      }
    }
    return `${relativeStr} • ${dateStr}`;
  }

  return `${timeStr} • ${dateStr}`;
}

/**
 * HELPER BARU: Mengubah URL Cloudinary biasa menjadi URL terkompresi otomatis
 */
export function getOptimizedImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_1280,c_limit/');
  }
  return url;
}