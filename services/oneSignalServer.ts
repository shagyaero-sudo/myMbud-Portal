const ONE_SIGNAL_APP_ID =
  'd5b7e852-4651-49dd-8123-41f1613e5169';

const ONE_SIGNAL_API_URL =
  'https://api.onesignal.com/notifications';

export async function sendOneSignalNotification({
  targetNrp,
  title,
  message,
  url,
}: {
  targetNrp: string;
  title: string;
  message: string;
  url?: string;
}) {
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ONESIGNAL_REST_API_KEY belum diset di environment variable.'
    );
  }

  if (!targetNrp) {
    throw new Error('targetNrp wajib diisi.');
  }

  const response = await fetch(ONE_SIGNAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: ONE_SIGNAL_APP_ID,

      include_aliases: {
        external_id: [targetNrp],
      },

      target_channel: 'push',

      headings: {
        en: title,
      },

      contents: {
        en: message,
      },

      ...(url ? { url } : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      '[OneSignal] API Error:',
      data
    );

    throw new Error(
      data?.errors?.join?.(', ') ||
        'Gagal mengirim OneSignal notification.'
    );
  }

  console.log(
    '[OneSignal] Notification sent:',
    data
  );

  return data;
}