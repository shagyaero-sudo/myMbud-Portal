const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

type MbudiaryPushBody = {
  targetNrp: string;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    console.error(
      '[OneSignal] Missing ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY di Vercel Environment Variables'
    );
    return res.status(500).json({ success: false, error: 'Server not configured' });
  }

  const { targetNrp, title, message, url, data } = (req.body ?? {}) as MbudiaryPushBody;

  if (!targetNrp || !title || !message) {
    return res
      .status(400)
      .json({ success: false, error: 'targetNrp, title, dan message wajib diisi' });
  }

  const payload = {
    app_id: appId,
    target_channel: 'push',
    include_aliases: {
      external_id: [targetNrp],
    },
    contents: { en: message },
    headings: { en: title },
    ...(url && { url }),
    ...(data && { data }),
  };

  try {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error('[OneSignal API Error]:', resData);
      return res.status(response.status).json({
        success: false,
        error: resData?.errors?.[0] ?? 'OneSignal API Error',
      });
    }

    return res.status(200).json({ success: true, ...resData });
  } catch (error) {
    console.error('[OneSignal Network Error]:', error);
    return res.status(502).json({ success: false, error: 'Failed to reach OneSignal servers' });
  }
}