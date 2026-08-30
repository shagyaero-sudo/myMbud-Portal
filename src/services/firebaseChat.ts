import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, set } from 'firebase/database';

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
  timestamp: number;
}

export interface RecentChatMeta {
  partnerNrp: string;
  lastMessage: string;
  lastTimestamp: number;
}

// 1. Kirim Pesan & Catat ke Recent Chats kedua belah pihak
export const sendChatMessage = async (senderNrp: string, recipientNrp: string, text: string) => {
  if (!text.trim()) return;

  const sNrp = senderNrp.trim().toLowerCase();
  const rNrp = recipientNrp.trim().toLowerCase();
  const roomId = getChatRoomId(sNrp, rNrp);
  const now = Date.now();
  const cleanText = text.trim();

  // Simpan data pesan
  const messagesRef = ref(rtdb, `chats/${roomId}/messages`);
  await push(messagesRef, {
    senderNrp: sNrp,
    text: cleanText,
    timestamp: now,
  });

  // Perbarui Recent Chat untuk Pengirim
  const senderRecentRef = ref(rtdb, `recent_chats/${sNrp}/${rNrp}`);
  await set(senderRecentRef, {
    partnerNrp: rNrp,
    lastMessage: cleanText,
    lastTimestamp: now,
  });

  // Perbarui Recent Chat untuk Penerima
  const recipientRecentRef = ref(rtdb, `recent_chats/${rNrp}/${sNrp}`);
  await set(recipientRecentRef, {
    partnerNrp: sNrp,
    lastMessage: cleanText,
    lastTimestamp: now,
  });

  // Tandai Unread Notification
  const unreadRef = ref(rtdb, `unread/${rNrp}/${sNrp}`);
  await set(unreadRef, true);
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

// 3. Listener Recent Chats (History Obrolan Saja)
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

// 4. Bersihkan Unread Dot saat chat dibuka
export const clearUnreadNotification = async (myNrp: string, partnerNrp: string) => {
  const cleanMyNrp = myNrp.trim().toLowerCase();
  const cleanPartnerNrp = partnerNrp.trim().toLowerCase();
  const unreadRef = ref(rtdb, `unread/${cleanMyNrp}/${cleanPartnerNrp}`);
  await set(unreadRef, null);
};

// 5. Global Unread Listener untuk Tombol Dashboard
export const subscribeToGlobalUnread = (myNrp: string, callback: (hasUnread: boolean) => void) => {
  const cleanNrp = myNrp.trim().toLowerCase();
  const userUnreadRef = ref(rtdb, `unread/${cleanNrp}`);
  return onValue(userUnreadRef, (snapshot) => {
    const data = snapshot.val();
    callback(Boolean(data && Object.keys(data).length > 0));
  });
};