package com.caminoleyenda.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/* Avisos opcionales (versión 3.5): un recordatorio local si no juegas en un día. Sin red ni servidores. */
public class Remind extends BroadcastReceiver {
    static final int ID = 4711;
    static final int IMMUTABLE = 0x04000000; /* PendingIntent.FLAG_IMMUTABLE */

    static PendingIntent pi(Context c, String t, String x) {
        Intent i = new Intent(c, Remind.class);
        i.putExtra("t", t); i.putExtra("x", x);
        return PendingIntent.getBroadcast(c, ID, i, PendingIntent.FLAG_UPDATE_CURRENT | IMMUTABLE);
    }
    public static void schedule(Context c, String t, String x, int minutes) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        am.set(AlarmManager.RTC, System.currentTimeMillis() + Math.max(1, minutes) * 60000L, pi(c, t, x));
    }
    public static void cancel(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(pi(c, "", ""));
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(ID);
    }
    @Override
    public void onReceive(Context c, Intent in) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        Notification.Builder b = new Notification.Builder(c);
        if (Build.VERSION.SDK_INT >= 26) {
            try {
                Class<?> ch = Class.forName("android.app.NotificationChannel");
                Object o = ch.getConstructor(String.class, CharSequence.class, int.class).newInstance("avisos", "Avisos", 3);
                NotificationManager.class.getMethod("createNotificationChannel", ch).invoke(nm, o);
                Notification.Builder.class.getMethod("setChannelId", String.class).invoke(b, "avisos");
            } catch (Exception e) { /* sin canal: Android antiguo */ }
        }
        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent op = PendingIntent.getActivity(c, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | IMMUTABLE);
        String t = in.getStringExtra("t"), x = in.getStringExtra("x");
        b.setSmallIcon(c.getApplicationInfo().icon).setContentTitle(t == null ? "" : t).setContentText(x == null ? "" : x).setAutoCancel(true).setContentIntent(op);
        nm.notify(ID, b.build());
    }
}
