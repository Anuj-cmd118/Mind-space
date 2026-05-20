package com.mindspace.app;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SettingsPlugin")
public class SettingsPlugin extends Plugin {

    @PluginMethod
    public void openUsageSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open Usage Access Settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
            } else {
                intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            try {
                // Fallback inside older android or different environments
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception ex) {
                call.reject("Could not open Overlay Settings: " + ex.getMessage());
            }
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("usageStats", hasUsageStatsPermission());
        ret.put("overlay", hasOverlayPermission());
        call.resolve(ret);
    }

    @PluginMethod
    public void updateBlockedApps(PluginCall call) {
        String appsJson = call.getString("appsJson", "[]");
        SharedPreferences prefs = getContext().getSharedPreferences("MindspacePrefs", Context.MODE_PRIVATE);
        prefs.edit().putString("blockedApps", appsJson).apply();
        
        // Ensure background interceptor service is running
        try {
            Intent intent = new Intent(getContext(), BackgroundLockService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }
        } catch (Exception e) {
            // Log or ignore gracefully, as service start can depend on specific emulator restrictions
        }
        
        call.resolve();
    }

    @PluginMethod
    public void getInterceptedApp(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences("MindspacePrefs", Context.MODE_PRIVATE);
        String intercepted = prefs.getString("interceptedApp", "");
        if (!intercepted.isEmpty()) {
            // clear it so it doesn't fire consecutively
            prefs.edit().remove("interceptedApp").apply();
        }
        JSObject ret = new JSObject();
        ret.put("interceptedApp", intercepted);
        call.resolve(ret);
    }

    private boolean hasUsageStatsPermission() {
        try {
            AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), getContext().getPackageName());
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean hasOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(getContext());
        }
        return true;
    }
}
