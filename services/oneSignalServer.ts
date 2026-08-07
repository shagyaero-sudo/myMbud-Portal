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

  // Pengaman 1: Jangan biarkan aplikasi crash kalau Env Var kosong
  if (!appId || !apiKey) {
    console.warn('[OneSignal] Missing APP_ID or REST_API_KEY in Vercel Environment Variables');
    return { success: false, error: 'Environment variables not configured' };
  }

  const payload = {
    app_id: appId,
    include_external_user_ids: [targetNrp],
    contents: { en: message },
    headings: { en: title },
    ...(url && { url }),
    ...(data && { data }),
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // Pengaman 2: Handle error response dari API OneSignal tanpa throw Error yang bikin 500
    const resData = await response.json();
    if (!response.ok) {
      console.error('[OneSignal API Error]:', resData);
      return { success: false, error: resData?.errors?.[0] || 'OneSignal API Error' };
    }

    return resData;
  } catch (error) {
    console.error('[OneSignal Network Error]:', error);
    return { success: false, error: 'Failed to reach OneSignal servers' };
  }
}