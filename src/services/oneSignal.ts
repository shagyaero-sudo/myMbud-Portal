import OneSignal from 'react-onesignal';

const ONE_SIGNAL_APP_ID = 'd5b7e852-4651-49dd-8123-41f1613e5169';

let initialized = false;

export async function initOneSignal() {
  if (initialized) return;

  try {
    await OneSignal.init({
      appId: ONE_SIGNAL_APP_ID,
      serviceWorkerPath: 'OneSignalSDKWorker.js', // Memastikan file di public/ terbaca sempurna
      allowLocalhostAsSecureOrigin: true, // Opsional buat testing di local kalau butuh
    });

    initialized = true;
    console.log('[OneSignal] Initialized successfully.');

    // KUNCI UTAMA: Panggil prompt izin notifikasi setelah init berhasil!
    if (OneSignal.Notifications.permission !== true) {
      console.log('[OneSignal] Requesting notification permission...');
      await OneSignal.Notifications.requestPermission();
    }
  } catch (error) {
    console.error('[OneSignal] Failed to initialize:', error);
  }
}

export async function loginOneSignal(nrp: string) {
  try {
    if (!nrp) return;

    await OneSignal.login(nrp);
    console.log('[OneSignal] User linked:', nrp);
  } catch (error) {
    console.error('[OneSignal] Failed to link user:', error);
  }
}

export async function logoutOneSignal() {
  try {
    await OneSignal.logout();
    console.log('[OneSignal] User disconnected.');
  } catch (error) {
    console.error('[OneSignal] Failed to disconnect user:', error);
  }
}