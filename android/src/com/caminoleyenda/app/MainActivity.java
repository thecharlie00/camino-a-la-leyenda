package com.caminoleyenda.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.ComponentName;
import android.content.Intent;
import android.content.ServiceConnection;
import android.net.Uri;
import android.os.Binder;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Parcel;
import android.view.KeyEvent;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/* Contenedor de la app: una WebView a pantalla completa que carga el juego desde los assets. */
public class MainActivity extends Activity {
    private WebView web;
    private volatile int updateCode = 0;
    private volatile String updateName = null;
    private boolean pageReady = false, updateChecked = false, updateDone = false;
    private ServiceConnection updConn = null;
    private final Handler ui = new Handler(Looper.getMainLooper());

    /* Puente para copiar el código de partida al portapapeles desde el juego. */
    public class Bridge {
        /* versión 3.5: recordatorio local si el jugador lo activa */
        @JavascriptInterface
        public void remind(String title, String text, int minutes) { Remind.schedule(MainActivity.this, title, text, minutes); }
        @JavascriptInterface
        public void cancelRemind() { Remind.cancel(MainActivity.this); }
        /* 5.6: respuesta háptica corta. performHapticFeedback respeta el ajuste de vibración táctil del sistema
           y no necesita permisos. kind: "tap" (suave), "ok" (acierto), "bad" (fallo), "big" (gol, parada) */
        @JavascriptInterface
        public void haptic(final String kind) {
            runOnUiThread(new Runnable() { public void run() {
                if (web == null) return;
                int c = android.view.HapticFeedbackConstants.KEYBOARD_TAP;
                if ("ok".equals(kind)) c = android.os.Build.VERSION.SDK_INT >= 30 ? 16 /* CONFIRM */ : android.view.HapticFeedbackConstants.VIRTUAL_KEY;
                else if ("bad".equals(kind)) c = android.os.Build.VERSION.SDK_INT >= 30 ? 17 /* REJECT */ : android.view.HapticFeedbackConstants.LONG_PRESS;
                else if ("big".equals(kind)) c = android.view.HapticFeedbackConstants.LONG_PRESS;
                web.performHapticFeedback(c);
            } });
        }
        @JavascriptInterface
        public void askNotify() {
            runOnUiThread(new Runnable() { public void run() {
                if (android.os.Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED)
                    requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 7);
            } });
        }

        @JavascriptInterface
        public void copy(final String text) {
            if (text == null || text.length() > 2000000) return;
            runOnUiThread(new Runnable() {
                public void run() {
                    ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Camino a la Leyenda", text));
                }
            });
        }

        /* versión instalada y versión nueva disponible en Google Play (0 si no hay) */
        @JavascriptInterface
        public int versionCode() { return myCode(); }

        @JavascriptInterface
        public int updateAvailable() { return updateCode; }

        @JavascriptInterface
        public String updateName() { return updateName == null ? "" : updateName; }

        /* abre la ficha de la app en Google Play para actualizar */
        @JavascriptInterface
        public void openStore() { runOnUiThread(new Runnable() { public void run() { openStorePage(); } }); }
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        web = new WebView(this);
        web.setBackgroundColor(0xFF0B1417);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        /* solo puede leer su propio juego empaquetado: nada de otros ficheros, contenido externo ni red */
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setAllowContentAccess(false);
        s.setGeolocationEnabled(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setTextZoom(100);
        WebView.setWebContentsDebuggingEnabled(false);
        web.setWebViewClient(new WebViewClient() {
            /* no navegar fuera del juego */
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) { return !url.startsWith("file:///android_asset/"); }

            @Override
            public void onPageFinished(WebView v, String url) { pageReady = true; tellUpdate(); }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        /* Android 15+ dibuja de borde a borde (obligatorio en 16): se deja hueco para la barra de estado y la de navegación */
        final android.widget.FrameLayout root = new android.widget.FrameLayout(this);
        root.setBackgroundColor(0xFF0B1417);
        root.addView(web);
        root.setOnApplyWindowInsetsListener(new android.view.View.OnApplyWindowInsetsListener() {
            public android.view.WindowInsets onApplyWindowInsets(android.view.View v, android.view.WindowInsets in) {
                v.setPadding(in.getSystemWindowInsetLeft(), in.getSystemWindowInsetTop(), in.getSystemWindowInsetRight(), in.getSystemWindowInsetBottom());
                return in;
            }
        });
        setContentView(root);
        registerBackCallback();
        if (state != null) web.restoreState(state);
        if (state == null || web.getUrl() == null) web.loadUrl("file:///android_asset/index.html");
        checkUpdate();
    }

    /* ---------- aviso de actualización ----------
       1) Se pregunta a la app de Google Play (el mismo servicio que usa la librería oficial de actualizaciones,
          así funciona también para los verificadores de la prueba cerrada).
       2) Si no responde, se lee la versión publicada en la ficha pública de Google Play.
       No se envía ningún dato del jugador: solo el nombre del paquete de la app. */
    private static final String UPD_SVC = "com.google.android.play.core.appupdate.protocol.IAppUpdateService";
    private static final String UPD_CB = "com.google.android.play.core.appupdate.protocol.IAppUpdateServiceCallback";

    private int myCode() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode; } catch (Exception e) { return 0; }
    }
    private String myName() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
    }

    private void checkUpdate() {
        if (updateChecked) return;
        updateChecked = true;
        try {
            Intent i = new Intent("com.google.android.play.core.install.BIND_UPDATE_SERVICE").setPackage("com.android.vending");
            updConn = new ServiceConnection() {
                public void onServiceConnected(ComponentName n, IBinder b) { askPlay(b); }
                public void onServiceDisconnected(ComponentName n) { }
            };
            if (!bindService(i, updConn, Context.BIND_AUTO_CREATE)) { updConn = null; checkWeb(); return; }
            ui.postDelayed(new Runnable() { public void run() { if (!updateDone) { unbindUpd(); checkWeb(); } } }, 9000);
        } catch (Throwable e) { updConn = null; checkWeb(); }
    }

    private void unbindUpd() {
        if (updConn == null) return;
        try { unbindService(updConn); } catch (Throwable e) { }
        updConn = null;
    }

    private void askPlay(IBinder svc) {
        Parcel d = Parcel.obtain();
        try {
            d.writeInterfaceToken(UPD_SVC);
            d.writeString(getPackageName());
            Bundle ex = new Bundle();
            ex.putInt("playcore.version.code", 11004);
            d.writeInt(1);
            ex.writeToParcel(d, 0);
            d.writeStrongBinder(new UpdCallback());
            svc.transact(2, d, null, IBinder.FLAG_ONEWAY);
        } catch (Throwable e) {
            ui.post(new Runnable() { public void run() { unbindUpd(); checkWeb(); } });
        } finally { d.recycle(); }
    }

    /* respuesta de Google Play */
    private class UpdCallback extends Binder {
        UpdCallback() { attachInterface(null, UPD_CB); }
        @Override
        protected boolean onTransact(int code, Parcel data, Parcel reply, int flags) throws android.os.RemoteException {
            if (code == INTERFACE_TRANSACTION) { if (reply != null) reply.writeString(UPD_CB); return true; }
            if (code >= FIRST_CALL_TRANSACTION && code <= LAST_CALL_TRANSACTION) {
                try {
                    data.enforceInterface(UPD_CB);
                    final Bundle b = data.readInt() != 0 ? Bundle.CREATOR.createFromParcel(data) : null;
                    if (code == 2) ui.post(new Runnable() { public void run() { onPlayInfo(b); } });
                } catch (Throwable e) { }
                return true;
            }
            return super.onTransact(code, data, reply, flags);
        }
    }

    private void onPlayInfo(Bundle b) {
        if (updateDone) return;
        unbindUpd();
        if (b == null || b.getInt("error.code", 0) != 0) { checkWeb(); return; }
        int avail = b.getInt("update.availability", 0), vc = b.getInt("version.code", 0);
        if (avail == 2 && vc > myCode()) {
            updateDone = true;
            updateCode = vc;
            tellUpdate();
        } else checkWeb();
    }

    /* plan B: la ficha pública de Google Play */
    private void checkWeb() {
        if (updateDone) return;
        updateDone = true;
        new Thread(new Runnable() {
            public void run() {
                java.net.HttpURLConnection c = null;
                try {
                    java.net.URL u = new java.net.URL("https://play.google.com/store/apps/details?id=" + getPackageName() + "&hl=en");
                    c = (java.net.HttpURLConnection) u.openConnection();
                    c.setConnectTimeout(8000); c.setReadTimeout(8000);
                    c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36");
                    if (c.getResponseCode() != 200) return;
                    java.io.InputStream in = c.getInputStream();
                    java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
                    byte[] buf = new byte[16384]; int n, tot = 0;
                    while ((n = in.read(buf)) > 0 && tot < 3000000) { bo.write(buf, 0, n); tot += n; }
                    in.close();
                    String html = bo.toString("UTF-8");
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\[\\[\\[\"(\\d+(?:\\.\\d+)+)\"\\]\\]").matcher(html);
                    if (m.find()) {
                        final String v = m.group(1);
                        if (newer(v, myName())) ui.post(new Runnable() { public void run() { updateName = v; updateCode = myCode() + 1; tellUpdate(); } });
                    }
                } catch (Throwable e) {
                } finally { if (c != null) c.disconnect(); }
            }
        }).start();
    }

    private static boolean newer(String a, String b) {
        try {
            String[] x = a.split("\\."), y = (b == null ? "" : b).split("\\.");
            for (int i = 0; i < Math.max(x.length, y.length); i++) {
                int p = i < x.length ? Integer.parseInt(x[i]) : 0, q = i < y.length && y[i].length() > 0 ? Integer.parseInt(y[i].replaceAll("\\D.*", "")) : 0;
                if (p != q) return p > q;
            }
        } catch (Throwable e) { }
        return false;
    }

    private void tellUpdate() {
        if (!pageReady || updateCode <= 0 || web == null) return;
        String nm = updateName == null ? "" : updateName.replaceAll("[^0-9.]", "");
        web.evaluateJavascript("window.caminoUpdate&&window.caminoUpdate(" + updateCode + ",'" + nm + "')", null);
    }

    private void openStorePage() {
        String pkg = getPackageName();
        try {
            Intent market = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg));
            market.setPackage("com.android.vending");
            market.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(market);
        } catch (Throwable e) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (Throwable e2) { }
        }
    }

    @Override
    protected void onDestroy() { unbindUpd(); super.onDestroy(); }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.evaluateJavascript("document.dispatchEvent(new Event('visibilitychange'))", null);
    }

    /* Atrás: primero cierra el panel abierto; si no hay ninguno, sale de la app. */
    private void handleBack() {
        web.evaluateJavascript("(function(){if(document.querySelector('.sheet')){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));return 1;}return 0;})()",
            new ValueCallback<String>() {
                public void onReceiveValue(String v) { if (!"1".equals(v)) finish(); }
            });
    }

    /* Android 13+ (y obligatorio al apuntar a Android 16): el botón/gesto atrás llega por OnBackInvokedCallback.
       Se registra por reflexión porque se compila contra una API antigua. */
    private void registerBackCallback() {
        if (android.os.Build.VERSION.SDK_INT < 33) return;
        try {
            Class<?> cbCls = Class.forName("android.window.OnBackInvokedCallback");
            Class<?> dispCls = Class.forName("android.window.OnBackInvokedDispatcher");
            Object disp = Activity.class.getMethod("getOnBackInvokedDispatcher").invoke(this);
            Object cb = java.lang.reflect.Proxy.newProxyInstance(cbCls.getClassLoader(), new Class<?>[]{cbCls},
                new java.lang.reflect.InvocationHandler() {
                    public Object invoke(Object proxy, java.lang.reflect.Method m, Object[] args) {
                        String n = m.getName();
                        if ("onBackInvoked".equals(n)) { handleBack(); return null; }
                        if ("equals".equals(n)) return proxy == args[0];
                        if ("hashCode".equals(n)) return System.identityHashCode(proxy);
                        if ("toString".equals(n)) return "CaminoBack";
                        return null;
                    }
                });
            dispCls.getMethod("registerOnBackInvokedCallback", int.class, cbCls).invoke(disp, 0, cb);
        } catch (Throwable e) { /* en versiones antiguas sigue funcionando onKeyDown */ }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) { handleBack(); return true; }
        return super.onKeyDown(keyCode, event);
    }
}
