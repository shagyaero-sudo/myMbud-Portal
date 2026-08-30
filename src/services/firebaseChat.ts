import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, set, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBAnCJiQblEWZbp9B1manRqQcdPYQui6TM",
  authDomain: "mbudtalk.firebaseapp.com",
  databaseURL: "https://mbudtalk-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mbudtalk",
  storageBucket: "mbudtalk.firebasestorage.app",
  messagingSenderId: "299698262424",
  appId: "1:299698262424:web:921c4d69e94a05f144dbed"
};

// Mencegah re-initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

// Helper untuk ID Room yang konsisten (NRP diurutkan secara alfabetis)
export const getChatRoomId = (nrp1: string, nrp2: string): string => {
  return [nrp1, nrp2].sort().join('_');
};

// Interface Pesan
export interface ChatMessage {
  id?: string;
  senderNrp: string;
  text: string;
  timestamp: number;
}

// 1. Kirim Pesan
export const sendChatMessage = async (senderNrp: string, recipientNrp: string, text: string) => {
  if (!text.trim()) return;

  const roomId = getChatRoomId(senderNrp, recipientNrp);
  const messagesRef = ref(rtdb, `chats/${roomId}/messages`);

  // Kirim data pesan baru
  await push(messagesRef, {
    senderNrp,
    text: text.trim(),
    timestamp: Date.now()
  });

  // Tandai unread indicator untuk penerima
  const unreadRef = ref(rtdb, `unread/${recipientNrp}/${senderNrp}`);
  await set(unreadRef, true);
};

// 2. Dengarkan Pesan Masuk di Room (Realtime Listener)
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

    // Urutkan berdasarkan waktu
    messageList.sort((a, b) => a.timestamp - b.timestamp);
    callback(messageList);
  });
};

// 3. Hapus Unread Dot saat chat dibuka
export const clearUnreadNotification = async (myNrp: string, partnerNrp: string) => {
  const unreadRef = ref(rtdb, `unread/${myNrp}/${partnerNrp}`);
  await set(unreadRef, null);
};

// 4. Global Unread Listener untuk Tombol Utama (Muncul Dot Merah)
export const subscribeToGlobalUnread = (myNrp: string, callback: (hasUnread: boolean) => void) => {
  const userUnreadRef = ref(rtdb, `unread/${myNrp}`);
  return onValue(userUnreadRef, (snapshot) => {
    const data = snapshot.val();
    callback(Boolean(data && Object.keys(data).length > 0));
  });
};