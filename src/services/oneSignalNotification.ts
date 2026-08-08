import {
  createNotification,
  updateNotificationPushStatus,
} from './notifications';

type MbudiaryNotificationParams = {
  targetNrp: string;
  title: string;
  message: string;
  type?: string;
  data?: Record<string, any>;
};

const PUSH_API_ENDPOINT = '/api/notifications/mbudiary';

/**
 * Panggil Vercel Serverless Function, BUKAN OneSignal langsung.
 * REST API Key OneSignal tidak boleh menyentuh bundle client.
 */
async function triggerOneSignalPush({
  targetNrp,
  title,
  message,
  data,
}: Omit<MbudiaryNotificationParams, 'type'>) {
  const response = await fetch(PUSH_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetNrp, title, message, data }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || `Push API returned ${response.status}`);
  }

  return result;
}

/**
 * ============================================================
 * CREATE IN-APP NOTIFICATION + SEND ONESIGNAL PUSH
 * ============================================================
 *
 * Urutan:
 * 1. Simpan notification ke Firestore (client SDK, sudah OK)
 * 2. Kalau berhasil, panggil /api/notifications/mbudiary (server-side)
 * 3. Update pushStatus di Firestore ('sent' / 'failed')
 *
 * Firestore adalah source of truth.
 */
export async function sendMbudiaryNotification({
  targetNrp,
  title,
  message,
  type = 'mbudiary',
  data,
}: MbudiaryNotificationParams) {
  if (!targetNrp) return null;

  let notificationId: string;

  try {
    notificationId = await createNotification({
      targetNrp,
      title,
      message,
      type,
      data,
    });

    console.log('[Notification] Saved to Firestore:', notificationId);
  } catch (error) {
    console.error('[Notification] Failed to save Firestore notification:', error);
    return null;
  }

  try {
    const pushResult = await triggerOneSignalPush({
      targetNrp,
      title,
      message,
      data,
    });

    await updateNotificationPushStatus(notificationId, 'sent');

    console.log('[Notification] Firestore + OneSignal success:', notificationId);

    return {
      notificationId,
      pushSent: true,
      result: pushResult,
    };
  } catch (error) {
    console.error('[Mbudiary Notification] Push failed:', error);

    try {
      await updateNotificationPushStatus(notificationId, 'failed');
    } catch (updateError) {
      console.error('[Notification] Failed updating push status:', updateError);
    }

    return {
      notificationId,
      pushSent: false,
      result: null,
    };
  }
}

/**
 * ============================================================
 * MBUDIARY LIKE
 * ============================================================
 */
export async function notifyPostLiked({
  postAuthorNrp,
  actorNrp,
  actorName,
  postId,
}: {
  postAuthorNrp: string;
  actorNrp: string;
  actorName: string;
  postId: string;
}) {
  if (postAuthorNrp.toLowerCase() === actorNrp.toLowerCase()) {
    return;
  }

  return sendMbudiaryNotification({
    targetNrp: postAuthorNrp,
    title: '❤️ Mbudiary',
    message: `${actorName} menyukai postinganmu.`,
    type: 'mbudiary_like',
    data: {
      type: 'mbudiary_like',
      postId,
      actorNrp,
    },
  });
}

/**
 * ============================================================
 * MBUDIARY COMMENT
 * ============================================================
 */
export async function notifyPostCommented({
  postAuthorNrp,
  actorNrp,
  actorName,
  postId,
  comment,
}: {
  postAuthorNrp: string;
  actorNrp: string;
  actorName: string;
  postId: string;
  comment: string;
}) {
  if (postAuthorNrp.toLowerCase() === actorNrp.toLowerCase()) {
    return;
  }

  return sendMbudiaryNotification({
    targetNrp: postAuthorNrp,
    title: '💬 Mbudiary',
    message: `${actorName} mengomentari postinganmu: "${comment}"`,
    type: 'mbudiary_comment',
    data: {
      type: 'mbudiary_comment',
      postId,
      actorNrp,
    },
  });
}

/**
 * ============================================================
 * GENERAL ANNOUNCEMENT
 * ============================================================
 */
export async function notifyAnnouncement({
  targetNrp,
  title,
  message,
  announcementId,
}: {
  targetNrp: string;
  title: string;
  message: string;
  announcementId?: string;
}) {
  return sendMbudiaryNotification({
    targetNrp,
    title,
    message,
    type: 'announcement',
    data: {
      type: 'announcement',
      announcementId,
    },
  });
}