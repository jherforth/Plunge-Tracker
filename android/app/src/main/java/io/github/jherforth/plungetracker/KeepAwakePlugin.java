package io.github.jherforth.plungetracker;

import android.view.WindowManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Holds the screen on while a plunge is running.
 *
 * Uses FLAG_KEEP_SCREEN_ON on the activity window, which requires no
 * permission. A PowerManager wake lock would do the same job but needs
 * android.permission.WAKE_LOCK, and this app deliberately requests no
 * permissions at all.
 *
 * The flag is scoped to this window, so Android drops it automatically if the
 * app is backgrounded or killed. There is no way to leak it and flatten the
 * battery.
 */
@CapacitorPlugin(name = "KeepAwake")
public class KeepAwakePlugin extends Plugin {

    @PluginMethod
    public void keepAwake(PluginCall call) {
        setKeepScreenOn(true);
        call.resolve();
    }

    @PluginMethod
    public void allowSleep(PluginCall call) {
        setKeepScreenOn(false);
        call.resolve();
    }

    private void setKeepScreenOn(boolean on) {
        // Window flags must be touched on the UI thread.
        getActivity()
            .runOnUiThread(() -> {
                if (on) {
                    getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                } else {
                    getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
            });
    }
}
