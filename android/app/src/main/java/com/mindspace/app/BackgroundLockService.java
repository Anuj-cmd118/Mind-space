package com.mindspace.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import java.util.HashSet;
import java.util.Set;

public class BackgroundLockService extends Service {
    private static final String TAG = "BackgroundLockService";
    private static final String CHANNEL_ID = "MindspaceBlockerChannel";
    private static final int NOTIFICATION_ID = 101;
    
    private Handler handler;
    private Runnable monitorRunnable;
    private String lastForegroundApp = "";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, getServiceNotification("Mindspace Conscious Interception Active"));
        
        handler = new Handler(Looper.getMainLooper());
        monitorRunnable = new Runnable() {
            @Override
            public void run() {
                checkForegroundApp();
                handler.postDelayed(this, 1000); // Check every 1 second for a good balance of responsiveness and battery life
            }
        };
        handler.post(monitorRunnable);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (handler != null && monitorRunnable != null) {
            handler.removeCallbacks(monitorRunnable);
        }
        super.onDestroy();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Mindspace Conscious Interceptor",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    private Notification getServiceNotification(String contentText) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Mindspace Mindful Shield")
                .setContentText(contentText)
                .setSmallIcon(android.R.drawable.ic_secure)
                .setPriority(NotificationCompat.PRIORITY_LOW);
                
        return builder.build();
    }

    private void checkForegroundApp() {
        String currentApp = getForegroundPackage();
        if (currentApp == null || currentApp.isEmpty() || currentApp.equals(getPackageName())) {
            return;
        }

        SharedPreferences prefs = getSharedPreferences("MindspacePrefs", Context.MODE_PRIVATE);
        String appsJsonStr = prefs.getString("blockedApps", "[]");
        
        try {
            JSONArray array = new JSONArray(appsJsonStr);
            Set<String> blockedApps = new HashSet<>();
            for (int i = 0; i < array.length(); i++) {
                blockedApps.add(array.getString(i));
            }

            if (blockedApps.contains(currentApp)) {
                if (!lastForegroundApp.equals(currentApp)) {
                    Log.d(TAG, "Intercepted blocked app: " + currentApp);
                    lastForegroundApp = currentApp;
                    
                    // Save intercepted package to preferences for the web overlay to read
                    prefs.edit().putString("interceptedApp", currentApp).apply();
                    
                    // Open Mindspace MainActivity
                    Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
                    if (launchIntent != null) {
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                        launchIntent.putExtra("interceptedApp", currentApp);
                        startActivity(launchIntent);
                    }
                }
            } else {
                lastForegroundApp = "";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in checkForegroundApp: ", e);
        }
    }

    private String getForegroundPackage() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return null;
            
            long endTime = System.currentTimeMillis();
            long startTime = endTime - 1000 * 5; // Search last 5 seconds of events
            
            UsageEvents usageEvents = usm.queryEvents(startTime, endTime);
            UsageEvents.Event event = new UsageEvents.Event();
            String foregroundApp = null;
            
            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    foregroundApp = event.getPackageName();
                }
            }
            return foregroundApp;
        }
        return null;
    }
}
