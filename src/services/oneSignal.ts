import OneSignal from 'react-onesignal';

const ONE_SIGNAL_APP_ID = 'd5b7e852-4651-49dd-8123-41f1613e5169';

let initialized = false;

/**
 * ============================================================
 * INITIALIZE ONESIGNAL
 * ============================================================
 */
export async function initOneSignal() {
  if (initialized) return true;

  try {
    await OneSignal.init({
      appId: ONE_SIGNAL_APP_ID,
      serviceWorkerPath: 'OneSignalSDKWorker.js',
      allowLocalhostAsSecureOrigin: true,
    });

    initialized = true;

    console.log('[OneSignal] Initialized successfully.');

    // LISTEN EVENT KLIK NOTIFIKASI
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('[OneSignal] Notification clicked:', event);

      const data = event.notification.additionalData || {};

      // Simpan konteks target navigasi ke localStorage
      if (data.postId) {
        localStorage.setItem('mbud_target_post_id', String(data.postId));
      }
      if (data.actorNrp) {
        localStorage.setItem('mbud_target_actor_nrp', String(data.actorNrp));
      }

      // Tentukan tab tujuan (default ke mbudiary)
      const targetTab = data.tab || 'mbudiary';
      localStorage.setItem('mbud_target_tab', targetTab);

      // Memicu event navigasi global di client
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mbud_onesignal_redirect', { detail: { tab: targetTab } }));
      }
    });

    return true;
  } catch (error) {
    console.error('[OneSignal] Failed to initialize:', error);
    return false;
  }
}

/**
 * ============================================================
 * REQUEST NOTIFICATION PERMISSION
 * ============================================================
 */
export async function requestOneSignalPermission() {
  try {
    if (!initialized) {
      const success = await initOneSignal();
      if (!success) return false;
    }

    if (OneSignal.Notifications.permission === true) {
      console.log('[OneSignal] Notification permission already granted.');
      return true;
    }

    console.log('[OneSignal] Requesting notification permission from user interaction...');
    await OneSignal.Notifications.requestPermission();

    const granted = OneSignal.Notifications.permission === true;
    console.log('[OneSignal] Permission result:', granted);
    return granted;
  } catch (error) {
    console.error('[OneSignal] Permission request failed:', error);
    return false;
  }
}

/**
 * ============================================================
 * LINK USER NRP
 * ============================================================
 */
export async function loginOneSignal(nrp: string) {
  try {
    if (!nrp) return;

    if (!initialized) {
      const success = await initOneSignal();
      if (!success) return;
    }

    await OneSignal.login(nrp);
    console.log('[OneSignal] User linked:', nrp);
  } catch (error) {
    console.error('[OneSignal] Failed to link user:', error);
  }
}

/**
 * ============================================================
 * LOGOUT
 * ============================================================
 */
export async function logoutOneSignal() {
  try {
    if (!initialized) return;

    await OneSignal.logout();
    console.log('[OneSignal] User disconnected.');
  } catch (error) {
    console.error('[OneSignal] Failed to disconnect user:', error);
  }
}