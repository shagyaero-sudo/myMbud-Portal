type MbudiaryNotificationParams = {
  targetNrp: string;
  title: string;
  message: string;
  data?: Record<string, any>;
};

export async function sendMbudiaryNotification({
  targetNrp,
  title,
  message,
  data,
}: MbudiaryNotificationParams) {
  if (!targetNrp) return;

  try {
    const response = await fetch('/api/notifications/mbudiary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetNrp,
        title,
        message,
        data,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Mbudiary Notification] Server error:', result);
      return null;
    }

    return result;
  } catch (error) {
    console.error('[Mbudiary Notification] Failed:', error);
    return null;
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
    data: {
      type: 'mbudiary_comment',
      postId,
      actorNrp,
    },
  });
}