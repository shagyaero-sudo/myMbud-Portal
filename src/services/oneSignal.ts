import OneSignal from 'react-onesignal';

const ONE_SIGNAL_APP_ID =
  'd5b7e852-4651-49dd-8123-41f1613e5169';

let initialized = false;

/**
 * ============================================================
 * INITIALIZE ONESIGNAL
 * ============================================================
 *
 * PENTING:
 * Fungsi ini TIDAK meminta permission.
 *
 * Jadi aman dipanggil dari useEffect.
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

    console.log(
      '[OneSignal] Initialized successfully.'
    );

    return true;
  } catch (error) {
    console.error(
      '[OneSignal] Failed to initialize:',
      error
    );

    return false;
  }
}

/**
 * ============================================================
 * REQUEST NOTIFICATION PERMISSION
 * ============================================================
 *
 * Fungsi ini HARUS dipanggil dari user interaction.
 *
 * Contoh:
 *
 * onClick={() => requestOneSignalPermission()}
 */
export async function requestOneSignalPermission() {
  try {
    if (!initialized) {
      const success = await initOneSignal();

      if (!success) {
        return false;
      }
    }

    if (OneSignal.Notifications.permission === true) {
      console.log(
        '[OneSignal] Notification permission already granted.'
      );

      return true;
    }

    console.log(
      '[OneSignal] Requesting notification permission from user interaction...'
    );

    await OneSignal.Notifications.requestPermission();

    const granted =
      OneSignal.Notifications.permission === true;

    console.log(
      '[OneSignal] Permission result:',
      granted
    );

    return granted;
  } catch (error) {
    console.error(
      '[OneSignal] Permission request failed:',
      error
    );

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

    console.log(
      '[OneSignal] User linked:',
      nrp
    );
  } catch (error) {
    console.error(
      '[OneSignal] Failed to link user:',
      error
    );
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

    console.log(
      '[OneSignal] User disconnected.'
    );
  } catch (error) {
    console.error(
      '[OneSignal] Failed to disconnect user:',
      error
    );
  }
}