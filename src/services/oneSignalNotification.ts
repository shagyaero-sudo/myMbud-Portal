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

export async function notifyUserFollowed({
  targetNrp,
  actorNrp,
  actorName,
}: {
  targetNrp: string;
  actorNrp: string;
  actorName: string;
}) {
  if (targetNrp.toLowerCase() === actorNrp.toLowerCase()) {
    return;
  }

  return sendMbudiaryNotification({
    targetNrp,
    title: '👤 Mbudiary',
    message: `${actorName} mulai mengikutimu.`,
    type: 'mbudiary_follow',
    data: {
      type: 'mbudiary_follow',
      actorNrp,
    },
  });
}

export async function sendOfficerNotification({
  targetNrp,
  title,
  message,
  allNrps = [],
}: {
  targetNrp: string;
  title: string;
  message: string;
  allNrps?: string[];
}) {
  const isBroadcast = targetNrp.trim().toUpperCase() === 'ALL' || targetNrp.trim() === '*';

  if (isBroadcast && allNrps.length > 0) {
    const results = await Promise.allSettled(
      allNrps.map((nrp) =>
        sendMbudiaryNotification({
          targetNrp: nrp,
          title: `📢 ${title}`,
          message,
          type: 'officer_announcement',
          data: { type: 'officer_announcement' },
        })
      )
    );
    return results;
  }

  const finalTarget = isBroadcast ? 'ALL' : targetNrp.trim();

  return sendMbudiaryNotification({
    targetNrp: finalTarget,
    title: `📢 ${title}`,
    message,
    type: 'officer_announcement',
    data: { type: 'officer_announcement' },
  });
}

export async function notifyUserMentioned({
  targetNrp,
  actorNrp,
  actorName,
  postId,
}: {
  targetNrp: string;
  actorNrp: string;
  actorName: string;
  postId?: string;
}) {
  if (targetNrp.toLowerCase() === actorNrp.toLowerCase()) {
    return;
  }

  return sendMbudiaryNotification({
    targetNrp,
    title: '🏷️ Mbudiary',
    message: `${actorName} menyebut kamu dalam postingan/komentar.`,
    type: 'mbudiary_mention',
    data: {
      type: 'mbudiary_mention',
      postId,
      actorNrp,
    },
  });
}

/**
 * ============================================================
 * MBUDTALK DIRECT MESSAGE NOTIFICATION (PUSH ONESIGNAL ONLY)
 * ============================================================
 */
export async function notifyChatDirectMessage({
  recipientNrp,
  senderNrp,
  senderName,
  messageText,
}: {
  recipientNrp: string;
  senderNrp: string;
  senderName: string;
  messageText: string;
}) {
  const cleanRecipient = (recipientNrp || '').trim().toLowerCase();
  const cleanSender = (senderNrp || '').trim().toLowerCase();

  if (!cleanRecipient || cleanRecipient === cleanSender) return null;

  try {
    const pushResult = await triggerOneSignalPush({
      targetNrp: cleanRecipient,
      title: `💬 ${senderName}`,
      message: messageText,
      data: {
        type: 'mbudtalk_dm',
        tab: 'mbudtalk',
        actorNrp: cleanSender,
      },
    });

    return pushResult;
  } catch (error) {
    console.error('[MbudTalk Push] Gagal mengirim push notif:', error);
    return null;
  }
}