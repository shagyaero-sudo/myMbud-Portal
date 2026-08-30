import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, set } from 'firebase/database';
import { notifyChatDirectMessage } from './oneSignalNotification';

const firebaseConfig = {
  apiKey: "AIzaSyBAnCJiQblEWZbp9B1manRqQcdPYQui6TM",
  authDomain: "mbudtalk.firebaseapp.com",
  databaseURL: "https://mbudtalk-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mbudtalk",
  storageBucket: "mbudtalk.firebasestorage.app",
  messagingSenderId: "299698262424",
  appId: "1:299698262424:web:921c4d69e94a05f144dbed"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

export const getChatRoomId = (nrp1: string, nrp2: string): string => {
  const clean1 = (nrp1 || '').trim().toLowerCase();
  const clean2 = (nrp2 || '').trim().toLowerCase();
  return [clean1, clean2].sort().join('_');
};

export interface ChatMessage {
  id?: string;
  senderNrp: string;
  text: string;
  imageUrl?: string; // Properti opsional untuk URL gambar Cloudinary
  timestamp: number;
}

export interface RecentChatMeta {
  partnerNrp: string;
  lastMessage: string;
  lastTimestamp: number;
}

// 1. Kirim Pesan & Trigger Unread (Mendukung Teks, Gambar Cloudinary, atau Keduanya)
export const sendChatMessage = async (
  senderNrp: string, 
  recipientNrp: string, 
  text: string,
  senderDisplayName?: string,
  imageUrl?: string
) => {
  if (!text.trim() && !imageUrl) return;

  const sNrp = senderNrp.trim().toLowerCase();
  const rNrp = recipientNrp.trim().toLowerCase();
  const roomId = getChatRoomId(sNrp, rNrp);
  const now = Date.now();
  const cleanText = text.trim();

  // Format teks pratinjau pesan terakhir di daftar chat
  const lastMsgText = imageUrl 
    ? (cleanText ? `📷 ${cleanText}` : '📷 [Gambar]') 
    : cleanText;

  // Payload pesan yang dikirim ke Realtime Database
  const payload: Record<string, any> = {
    senderNrp: sNrp,
    text: cleanText,
    timestamp: now,
  };

  if (imageUrl) {
    payload.imageUrl = imageUrl;
  }

  const messagesRef = ref(rtdb, `chats/${roomId}/messages`);
  await push(messagesRef, payload);

  // Update daftar chat terakhir pengirim
  const senderRecentRef = ref(rtdb, `recent_chats/${sNrp}/${rNrp}`);
  await set(senderRecentRef, {
    partnerNrp: rNrp,
    lastMessage: lastMsgText,
    lastTimestamp: now,
  });

  // Update daftar chat terakhir penerima
  const recipientRecentRef = ref(rtdb, `recent_chats/${rNrp}/${sNrp}`);
  await set(recipientRecentRef, {
    partnerNrp: sNrp,
    lastMessage: lastMsgText,
    lastTimestamp: now,
  });

  // Tandai unread untuk lawan bicara
  const unreadRef = ref(rtdb, `unread/${rNrp}/${sNrp}`);
  await set(unreadRef, true);

  // Kirim notifikasi push
  notifyChatDirectMessage({
    recipientNrp: rNrp,
    senderNrp: sNrp,
    senderName: senderDisplayName || 'Teman',
    messageText: lastMsgText,
  }).catch((err) => console.error('[Push DM Error]:', err));
};

// 2. Listener Room Chat Aktif
export const subscribeToChatRoom = (
  senderNrp: string,
  recipientNrp: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const roomId = getChatRoomId(senderNrp, recipientNrp);
  const messagesRef = ref(rtdb, `chats/${roomId}/messages`);

  return onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const messageList: ChatMessage[] = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));

    messageList.sort((a, b) => a.timestamp - b.timestamp);
    callback(messageList);
  });
};

// 3. Listener Recent Chats
export const subscribeToRecentChats = (
  myNrp: string,
  callback: (recentList: RecentChatMeta[]) => void
) => {
  const cleanNrp = myNrp.trim().toLowerCase();
  const recentRef = ref(rtdb, `recent_chats/${cleanNrp}`);

  return onValue(recentRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const list: RecentChatMeta[] = Object.values(data);
    list.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
    callback(list);
  });
};

// 4. Listener Seluruh Status Unread Chat
export const subscribeToUserUnreads = (
  myNrp: string,
  callback: (unreadMap: Record<string, boolean>) => void
) => {
  const cleanNrp = myNrp.trim().toLowerCase();
  const userUnreadRef = ref(rtdb, `unread/${cleanNrp}`);
  return onValue(userUnreadRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  });
};

// 5. Bersihkan Unread Dot saat chat dibuka
export const clearUnreadNotification = async (myNrp: string, partnerNrp: string) => {
  const cleanMyNrp = myNrp.trim().toLowerCase();
  const cleanPartnerNrp = partnerNrp.trim().toLowerCase();
  const unreadRef = ref(rtdb, `unread/${cleanMyNrp}/${cleanPartnerNrp}`);
  await set(unreadRef, null);
};

// 6. Global Unread Listener untuk Tombol Dashboard
export const subscribeToGlobalUnread = (myNrp: string, callback: (hasUnread: boolean) => void) => {
  const cleanNrp = myNrp.trim().toLowerCase();
  const userUnreadRef = ref(rtdb, `unread/${cleanNrp}`);
  return onValue(userUnreadRef, (snapshot) => {
    const data = snapshot.val();
    callback(Boolean(data && Object.keys(data).length > 0));
  });
};