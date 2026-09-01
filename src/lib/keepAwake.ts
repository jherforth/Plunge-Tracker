import { Capacitor, registerPlugin } from '@capacitor/core';

interface KeepAwakePlugin {
  keepAwake(): Promise<void>;
  allowSleep(): Promise<void>;
}

const native = registerPlugin<KeepAwakePlugin>('KeepAwake');

let webSentinel: WakeLockSentinel | null = null;

/**
 * Hold the screen on.
 *
 * On Android this calls into the local KeepAwake plugin, which sets
 * FLAG_KEEP_SCREEN_ON and needs no permission. In a browser it uses the Screen
 * Wake Lock API where available; that API is not exposed in Android's WebView,
 * which is why the native plugin exists rather than relying on it everywhere.
 *
 * Failing to hold the screen on must never break the timer, so every path
 * swallows its error.
 */
export async function keepAwake(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await native.keepAwake();
      return;
    }
    if ('wakeLock' in navigator && !webSentinel) {
      webSentinel = await navigator.wakeLock.request('screen');
      // The browser drops the lock whenever the page is hidden.
      webSentinel.addEventListener('release', () => {
        webSentinel = null;
      });
    }
  } catch (err) {
    console.warn('Could not keep the screen awake', err);
  }
}

export async function allowSleep(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await native.allowSleep();
      return;
    }
    await webSentinel?.release();
    webSentinel = null;
  } catch (err) {
    console.warn('Could not release the screen lock', err);
  }
}
