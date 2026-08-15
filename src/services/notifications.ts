import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

import { db } from './firebase';

export interface AppNotification {
  id: string;
  targetNrp: string;
  title: string;
  message: string;
  createdAt: Timestamp | null;
  isRead: boolean;
  type?: string;
  data?: Record<string, any>;
  pushStatus?: 'pending' | 'sent' | 'failed';
}

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * ============================================================
 * REALTIME NOTIFICATION LISTENER
 * ============================================================
 */
export function subscribeNotifications(
  targetNrp: string,
  callback: (notifications: AppNotification[]) => void
) {
  if (!targetNrp) {
    callback([]);
    return () => {};
  }

  // Mengambil notifikasi user bersangkutan DAN notifikasi global 'ALL'
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('targetNrp', 'in', [targetNrp, 'ALL'])
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: AppNotification[] =
        snapshot.docs.map((snapshotDoc) => {
          const data = snapshotDoc.data();

          return {
            id: snapshotDoc.id,
            targetNrp: data.targetNrp || targetNrp,
            title: data.title || 'Notifikasi',
            message: data.message || '',
            createdAt: data.createdAt || null,
            isRead: Boolean(data.isRead),
            type: data.type || undefined,
            data: data.data || undefined,
            pushStatus: data.pushStatus || undefined,
          };
        });

      /*
       * Sorting dilakukan di client.
       * Jadi tidak membutuhkan Composite Index Firestore untuk where + orderBy.
       */
      notifications.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;

        return bTime - aTime;
      });

      callback(notifications);
    },
    (error) => {
      console.error(
        '[Notifications] Realtime listener error:',
        error
      );

      callback([]);
    }
  );
}

/**
 * ============================================================
 * CREATE NOTIFICATION
 * ============================================================
 */
export async function createNotification({
  targetNrp,
  title,
  message,
  type,
  data,
}: {
  targetNrp: string;
  title: string;
  message: string;
  type?: string;
  data?: Record<string, any>;
}) {
  if (!targetNrp || !title || !message) {
    throw new Error(
      'targetNrp, title, dan message wajib diisi.'
    );
  }

  const docRef = await addDoc(
    collection(db, NOTIFICATIONS_COLLECTION),
    {
      targetNrp,
      title,
      message,
      createdAt: serverTimestamp(),
      isRead: false,
      type: type || 'general',
      data: data || {},
      pushStatus: 'pending',
    }
  );

  return docRef.id;
}

/**
 * ============================================================
 * MARK ONE NOTIFICATION AS READ
 * ============================================================
 */
export async function markNotificationAsRead(
  notificationId: string
) {
  await updateDoc(
    doc(
      db,
      NOTIFICATIONS_COLLECTION,
      notificationId
    ),
    {
      isRead: true,
    }
  );
}

/**
 * ============================================================
 * MARK ALL AS READ
 * ============================================================
 */
export async function markAllNotificationsAsRead(
  targetNrp: string
) {
  if (!targetNrp) return;

  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('targetNrp', 'in', [targetNrp, 'ALL']),
    where('isRead', '==', false)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const batch = writeBatch(db);

  snapshot.docs.forEach((notificationDoc) => {
    batch.update(notificationDoc.ref, {
      isRead: true,
    });
  });

  await batch.commit();
}

/**
 * ============================================================
 * UPDATE PUSH STATUS
 * ============================================================
 */
export async function updateNotificationPushStatus(
  notificationId: string,
  status: 'sent' | 'failed'
) {
  await updateDoc(
    doc(
      db,
      NOTIFICATIONS_COLLECTION,
      notificationId
    ),
    {
      pushStatus: status,
    }
  );
}

/**
 * ============================================================
 * DELETE NOTIFICATION
 * ============================================================
 */
export async function deleteNotification(
  notificationId: string
) {
  await deleteDoc(
    doc(
      db,
      NOTIFICATIONS_COLLECTION,
      notificationId
    )
  );
}