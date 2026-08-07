export type OneSignalNotificationParams = {
  targetNrp: string;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
};

export async function sendOneSignalNotification({
  targetNrp,
  title,
  message,
  url,
  data,
}: OneSignalNotificationParams) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    throw new Error('ONESIGNAL_APP_ID dan ONESIGNAL_REST_API_KEY belum dikonfigurasi.');
  }

  const payload = {
    app_id: appId,
    include_external_user_ids: [targetNrp],
    contents: { en: message },
    headings: { en: title },
    ...(url && { url }),
    ...(data && { data }),
  };

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData?.errors?.[0] || 'Gagal mengontak API OneSignal');
  }

  return resData;
}