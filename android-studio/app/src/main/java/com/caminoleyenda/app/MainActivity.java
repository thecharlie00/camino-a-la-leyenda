package com.caminoleyenda.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.window.OnBackInvokedDispatcher;

import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.install.model.UpdateAvailability;

/* Contenedor de la app: una WebView a pantalla completa con el juego.
   - Anuncios: clase Ads (en la versión «noads» no hace nada).
   - Actualizaciones: al abrir, pregunta a Google Play si hay una versión nueva y se lo dice al juego,
     que enseña un aviso con un botón que abre la ficha de la app en Play Store. */
public class MainActivity extends Activity {
    private WebView web;
    private Ads ads;
    private volatile int updateCode = 0;   // versionCode nuevo disponible en Play (0 = ninguno)
    private volatile boolean pageReady = false;

    /* Puente con el juego (JavaScript). */
    public class Bridge {
        /* versión 3.5: recordatorio local si el jugador lo activa */
        @JavascriptInterface
        public void remind(String title, String text, int minutes) { Remind.schedule(MainActivity.this, title, text, minutes); }
        @JavascriptInterface
        public void cancelRemind() { Remind.cancel(MainActivity.this); }
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
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Camino a la Leyenda", text));
            });
        }

        @JavascriptInterface
        public boolean showAd(String where) { return ads.show(); }

        @JavascriptInterface
        public boolean privacyOptionsRequired() { return ads.privacyOptionsRequired(); }

        @JavascriptInterface
        public void showPrivacyOptions() { ads.showPrivacyOptions(); }

        /* versión instalada y versión nueva disponible (0 si no hay) */
        @JavascriptInterface
        public int versionCode() { return BuildConfig.VERSION_CODE; }

        @JavascriptInterface
        public int updateAvailable() { return updateCode; }

        /* abre la ficha de la app en Google Play para actualizar */
        @JavascriptInterface
        public void openStore() { runOnUiThread(MainActivity.this::openStorePage); }
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

        /* Android 15+ dibuja de borde a borde: se deja hueco para la barra de estado y la de navegación */
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF0B1417);
        root.addView(web);
        root.setOnApplyWindowInsetsListener((View v, WindowInsets in) -> {
            v.setPadding(in.getSystemWindowInsetLeft(), in.getSystemWindowInsetTop(), in.getSystemWindowInsetRight(), in.getSystemWindowInsetBottom());
            return in;
        });
        setContentView(root);

        /* Android 13+ (obligatorio al apuntar a Android 16): botón/gesto atrás */
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }

        if (state != null) web.restoreState(state);
        if (state == null || web.getUrl() == null) web.loadUrl("file:///android_asset/index.html");

        ads = new Ads(this);
        ads.start();
        checkUpdate();
    }

    /* ---------- actualizaciones ---------- */
    private void checkUpdate() {
        try {
            AppUpdateManagerFactory.create(this).getAppUpdateInfo().addOnSuccessListener((AppUpdateInfo info) -> {
                if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE && info.availableVersionCode() > BuildConfig.VERSION_CODE) {
                    updateCode = info.availableVersionCode();
                    runOnUiThread(this::tellUpdate);
                }
            });
        } catch (Exception e) { /* sin Google Play (p. ej. instalada a mano): no se avisa */ }
    }

    private void tellUpdate() {
        if (!pageReady || updateCode <= 0 || web == null) return;
        web.evaluateJavascript("window.caminoUpdate&&window.caminoUpdate(" + updateCode + ")", null);
    }

    private void openStorePage() {
        String pkg = getPackageName();
        Intent market = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg));
        market.setPackage("com.android.vending");
        market.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            startActivity(market);
        } catch (ActivityNotFoundException e) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            } catch (ActivityNotFoundException ignored) { }
        }
    }

    /* ---------- ciclo de vida ---------- */
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

    @Override
    protected void onDestroy() {
        if (ads != null) ads.destroy();
        super.onDestroy();
    }

    /* Atrás: primero cierra el panel abierto; si no hay ninguno, sale de la app. */
    private void handleBack() {
        web.evaluateJavascript("(function(){if(document.querySelector('.sheet')){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));return 1;}return 0;})()",
            (ValueCallback<String>) v -> { if (!"1".equals(v)) finish(); });
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) { handleBack(); return true; }
        return super.onKeyDown(keyCode, event);
    }
}
