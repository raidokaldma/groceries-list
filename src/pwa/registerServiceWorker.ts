import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** The new service worker takes over as soon as it is installed and the page reloads itself onto the new version. */
export function registerServiceWorker(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const checkForUpdate = () => navigator.onLine && registration.update();
      setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && checkForUpdate());
    },
  });
}
