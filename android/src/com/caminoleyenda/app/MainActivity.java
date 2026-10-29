package com.caminoleyenda.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.HapticFeedbackConstants;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.net.ssl.HttpsURLConnection;

public final class MainActivity extends Activity {
    private static final String PLAY_RELEASE_URL = "https://futbolroadtolegend.com/play-store-version.json";
    private static final String GOAT_CAREER_URL = "https://camino-goat-ladder.httpscamino-goat-ladderworkersdev.workers.dev/api/goat-ladder/careers";
    private static final long UPDATE_CHECK_INTERVAL_MS = 2L * 60L * 1000L;
    private static final int MAX_UPDATE_FEED_CHARS = 16384;
    private static final int MAX_GOAT_REQUEST_BYTES = 100000;
    private static final int MAX_GOAT_RESPONSE_BYTES = 1000000;
    private WebView webView;
    private volatile int availableUpdateCode;
    private volatile String availableUpdateName = "";
    private volatile long lastUpdateCheckAt;
    private final AtomicBoolean updateCheckRunning = new AtomicBoolean(false);
    private final ExecutorService updateChecker = Executors.newSingleThreadExecutor();
    private final ExecutorService goatRequestWorker = Executors.newFixedThreadPool(2);
    // Object avoids resolving the API-33 callback type on devices below API 33.
    private Object backInvokedCallback;

    public class Bridge {
        @JavascriptInterface
        public void copy(final String text) {
            if (text == null || text.length() > 2000000) return;
            runUiSafely(new Runnable() {
                public void run() {
                    ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    if (cm != null) {
                        cm.setPrimaryClip(ClipData.newPlainText("Camino a la Leyenda", text));
                    }
                }
            });
        }

        @JavascriptInterface
        public void haptic(final String kind) {
            runUiSafely(new Runnable() {
                public void run() {
                    if (webView == null) return;
                    int feedback = HapticFeedbackConstants.KEYBOARD_TAP;
                    if ("ok".equals(kind)) {
                        feedback = Build.VERSION.SDK_INT >= 30 ? 16 /* CONFIRM */ : HapticFeedbackConstants.VIRTUAL_KEY;
                    } else if ("bad".equals(kind)) {
                        feedback = Build.VERSION.SDK_INT >= 30 ? 17 /* REJECT */ : HapticFeedbackConstants.LONG_PRESS;
                    } else if ("big".equals(kind)) {
                        feedback = HapticFeedbackConstants.LONG_PRESS;
                    }
                    try {
                        webView.performHapticFeedback(feedback);
                    } catch (Throwable ignored) {}
                }
            });
        }

        @JavascriptInterface
        public int versionCode() {
            return installedVersionCode();
        }

        @JavascriptInterface
        public int updateAvailable() {
            return availableUpdateCode;
        }

        @JavascriptInterface
        public String updateName() {
            return availableUpdateName;
        }

        @JavascriptInterface
        public void openStore() {
            runUiSafely(new Runnable() {
                public void run() {
                    String pkg = getPackageName();
                    try {
                        Intent market = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg));
                        market.setPackage("com.android.vending");
                        market.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(market);
                    } catch (Throwable e) {
                        try {
                            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                        } catch (Throwable ignored) {}
                    }
                }
            });
        }

        @JavascriptInterface
        public void showAd(final String where) {
            // Safe stub for interstitial / transition ads
        }

        @JavascriptInterface
        public boolean privacyOptionsRequired() {
            return false;
        }

        @JavascriptInterface
        public void showPrivacyOptions() {
            // Safe stub for consent / privacy settings dialog
        }

        @JavascriptInterface
        public void remind(final String title, final String text, final int delaySeconds) {
            // Safe stub for scheduled notifications
        }

        @JavascriptInterface
        public void cancelRemind() {
            // Safe stub
        }

        @JavascriptInterface
        public void askNotify() {
            // Safe stub for notification permission prompt
        }

        @JavascriptInterface
        public void goatCareerPost(final String requestId, final String body, final String contentType) {
            if (requestId == null || !requestId.matches("goat_[A-Za-z0-9_]+")) return;
            if (body == null || body.getBytes(StandardCharsets.UTF_8).length > MAX_GOAT_REQUEST_BYTES
                    || !("application/json".equalsIgnoreCase(contentType)
                        || "text/plain;charset=UTF-8".equalsIgnoreCase(contentType))) {
                completeGoatCareerRequest(requestId, 400, "{\"error\":\"Invalid GOAT career request\"}");
                return;
            }
            try {
                goatRequestWorker.execute(new Runnable() {
                    @Override
                    public void run() {
                        performGoatCareerRequest(requestId, body, contentType);
                    }
                });
            } catch (Throwable error) {
                completeGoatCareerRequest(requestId, 0, "");
            }
        }
    }

    // Android loads the game from file://, whose opaque origin can be rejected by
    // a cross-origin WebView POST. Send career submissions natively over HTTPS so
    // browser CORS is not involved; the URL is fixed (never supplied by JavaScript).
    private void performGoatCareerRequest(String requestId, String body, String contentType) {
        HttpURLConnection connection = null;
        int status = 0;
        String responseBody = "";
        OutputStream output = null;
        InputStream input = null;
        try {
            connection = (HttpURLConnection) new URL(GOAT_CAREER_URL).openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(7000);
            connection.setReadTimeout(16000);
            connection.setUseCaches(false);
            connection.setInstanceFollowRedirects(false);
            connection.setDoOutput(true);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Content-Type", contentType);
            byte[] payload = body.getBytes(StandardCharsets.UTF_8);
            output = connection.getOutputStream();
            output.write(payload);
            output.flush();
            status = connection.getResponseCode();
            input = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
            responseBody = readGoatResponse(input);
        } catch (java.net.SocketTimeoutException timeout) {
            status = -1;
        } catch (Throwable error) {
            status = 0;
        } finally {
            if (output != null) try { output.close(); } catch (Throwable ignored) {}
            if (input != null) try { input.close(); } catch (Throwable ignored) {}
            if (connection != null) connection.disconnect();
        }
        completeGoatCareerRequest(requestId, status, responseBody);
    }

    private String readGoatResponse(InputStream input) throws Exception {
        if (input == null) return "";
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int count;
        while ((count = input.read(buffer)) != -1) {
            int remaining = MAX_GOAT_RESPONSE_BYTES - output.size();
            if (remaining <= 0) break;
            output.write(buffer, 0, Math.min(count, remaining));
        }
        return new String(output.toByteArray(), StandardCharsets.UTF_8);
    }

    private void completeGoatCareerRequest(final String requestId, final int status, final String body) {
        if (requestId == null || !requestId.matches("goat_[A-Za-z0-9_]+")) return;
        runUiSafely(new Runnable() {
            @Override
            public void run() {
                WebView target = webView;
                if (target == null) return;
                String script = "if(window.__caminoGoatNativeComplete){window.__caminoGoatNativeComplete("
                    + JSONObject.quote(requestId) + "," + status + "," + JSONObject.quote(body == null ? "" : body) + ");}";
                target.evaluateJavascript(script, null);
            }
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureEdgeToEdge();

        try {
            webView = new WebView(this);
            webView.setBackgroundColor(Color.rgb(11, 20, 23));
            webView.setWebViewClient(createWebViewClient());
            webView.setWebChromeClient(new WebChromeClient());

            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(false);
            settings.setAllowFileAccessFromFileURLs(false);
            settings.setAllowUniversalAccessFromFileURLs(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            settings.setSupportMultipleWindows(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Edge-to-edge draws the WebView behind Android's status bar. Keep the
            // game content (including its top-bar buttons) below that inset while
            // leaving the WebView background and the lower navigation area edge-to-edge.
            webView.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override
                public WindowInsets onApplyWindowInsets(View view, WindowInsets insets) {
                    int topInset = Build.VERSION.SDK_INT >= 28 ? insets.getSystemWindowInsetTop() : 0;
                    if (view.getPaddingTop() != topInset) {
                        view.setPadding(view.getPaddingLeft(), topInset, view.getPaddingRight(), view.getPaddingBottom());
                    }
                    return insets;
                }
            });

            webView.addJavascriptInterface(new Bridge(), "AndroidBridge");
            setContentView(webView);

            if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null || webView.getUrl() == null) {
                webView.loadUrl("file:///android_asset/jugar/juego.html");
            }
            registerPredictiveBack();
        } catch (Throwable t) {
            disposeWebView(webView);
            try {
                android.widget.TextView tv = new android.widget.TextView(this);
                tv.setText("No se pudo iniciar el componente WebView del sistema. Asegúrate de tener Android System WebView actualizado.");
                tv.setTextColor(Color.WHITE);
                tv.setBackgroundColor(Color.rgb(11, 20, 23));
                tv.setPadding(40, 80, 40, 40);
                setContentView(tv);
            } catch (Throwable ignored) {}
        }
    }

    private WebViewClient createWebViewClient() {
        if (Build.VERSION.SDK_INT >= 26) {
            try {
                return Api26.createWebViewClient(this);
            } catch (Throwable ignored) {
                // Fall back to the API-24-safe client if the platform callback is unavailable.
            }
        }
        return new NavigationWebViewClient(this);
    }

    private void runUiSafely(Runnable action) {
        try {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        if (!isFinishing()) action.run();
                    } catch (Throwable ignored) {}
                }
            });
        } catch (Throwable ignored) {}
    }

    private int installedVersionCode() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
        } catch (Throwable ignored) {
            return 0;
        }
    }

    // The site publishes this small release pointer only after that version is live
    // in Google Play. Check off the UI thread; the game can keep running offline.
    private void checkForPlayStoreUpdate() {
        final long now = System.currentTimeMillis();
        if (!updateCheckRunning.compareAndSet(false, true)) return;
        synchronized (this) {
            if (lastUpdateCheckAt != 0 && now - lastUpdateCheckAt < UPDATE_CHECK_INTERVAL_MS) {
                updateCheckRunning.set(false);
                return;
            }
            lastUpdateCheckAt = now;
        }
        try {
            updateChecker.execute(new Runnable() {
                @Override
                public void run() {
                    HttpsURLConnection connection = null;
                    try {
                        connection = (HttpsURLConnection) new URL(PLAY_RELEASE_URL).openConnection();
                        connection.setRequestMethod("GET");
                        connection.setConnectTimeout(5000);
                        connection.setReadTimeout(5000);
                        connection.setUseCaches(false);
                        connection.setRequestProperty("Accept", "application/json");
                        connection.setRequestProperty("Cache-Control", "no-cache");
                        if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) return;
                        StringBuilder body = new StringBuilder();
                        InputStream input = connection.getInputStream();
                        BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8));
                        char[] buffer = new char[1024];
                        int count;
                        while ((count = reader.read(buffer)) != -1) {
                            if (body.length() + count > MAX_UPDATE_FEED_CHARS) return;
                            body.append(buffer, 0, count);
                        }
                        reader.close();
                        JSONObject feed = new JSONObject(body.toString());
                        if (!getPackageName().equals(feed.optString("packageName", ""))) return;
                        int latestCode = feed.optInt("versionCode", 0);
                        String latestName = feed.optString("versionName", "");
                        if (latestCode > installedVersionCode()) {
                            availableUpdateCode = latestCode;
                            availableUpdateName = latestName;
                            notifyWebOfUpdate();
                        } else {
                            availableUpdateCode = 0;
                            availableUpdateName = "";
                        }
                    } catch (Throwable ignored) {
                        // A missing feed or network connection must never block game startup.
                    } finally {
                        if (connection != null) connection.disconnect();
                        updateCheckRunning.set(false);
                    }
                }
            });
        } catch (Throwable ignored) {
            updateCheckRunning.set(false);
        }
    }

    private void notifyWebOfUpdate() {
        final int code = availableUpdateCode;
        final String name = availableUpdateName;
        if (code <= 0 || webView == null) return;
        runUiSafely(new Runnable() {
            @Override
            public void run() {
                WebView target = webView;
                if (target == null) return;
                target.evaluateJavascript("if(typeof window.caminoUpdate==='function'){window.caminoUpdate("
                    + code + "," + JSONObject.quote(name) + ");}", null);
            }
        });
    }

    private boolean openExternalUrl(String url) {
        if (url == null) return true;
        if (url.startsWith("file:///android_asset/")) return false;
        try {
            String scheme = Uri.parse(url).getScheme();
            if ("http".equalsIgnoreCase(scheme)
                    || "https".equalsIgnoreCase(scheme)
                    || "mailto".equalsIgnoreCase(scheme)) {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            }
        } catch (Throwable ignored) {}
        return true;
    }

    private void disposeWebView(WebView target) {
        WebView old = target != null ? target : webView;
        if (old == null) return;
        if (old == webView) webView = null;
        try { old.stopLoading(); } catch (Throwable ignored) {}
        try {
            if (old.getParent() instanceof android.view.ViewGroup) {
                ((android.view.ViewGroup) old.getParent()).removeView(old);
            }
        } catch (Throwable ignored) {}
        try { old.destroy(); } catch (Throwable ignored) {}
    }

    private boolean onRenderProcessGone(WebView view) {
        disposeWebView(view);
        finish();
        return true;
    }

    private void configureEdgeToEdge() {
        try {
            Window window = getWindow();
            if (Build.VERSION.SDK_INT >= 28) {
                window.setStatusBarColor(Color.TRANSPARENT);
                window.setNavigationBarColor(Color.TRANSPARENT);
            } else {
                int appSurface = Color.rgb(11, 20, 23);
                window.setStatusBarColor(appSurface);
                window.setNavigationBarColor(appSurface);
            }
            if (Build.VERSION.SDK_INT >= 29) {
                Api29.disableSystemBarContrastEnforcement(window);
            }
            if (Build.VERSION.SDK_INT >= 30) {
                Api30.configureEdgeToEdge(window);
            } else if (Build.VERSION.SDK_INT >= 28) {
                window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
            }
        } catch (Throwable ignored) {
        }
    }

    private void registerPredictiveBack() {
        if (Build.VERSION.SDK_INT >= 33) {
            backInvokedCallback = Api33.register(this);
        }
    }

    private void handleBack() {
        if (webView != null) {
            webView.evaluateJavascript(
                "(function(){if(document.querySelector('.sheet')){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));return 1;}return 0;})()",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String val) {
                        if (!"1".equals(val)) {
                            if (webView != null && webView.canGoBack()) {
                                webView.goBack();
                            } else {
                                finish();
                            }
                        }
                    }
                });
        } else {
            finish();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        checkForPlayStoreUpdate();
    }

    @Override
    public void onBackPressed() {
        handleBack();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            handleBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (webView != null) {
            webView.requestLayout();
            webView.invalidate();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) {
            webView.saveState(outState);
        }
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= 33 && backInvokedCallback != null) {
            Api33.unregister(this, backInvokedCallback);
            backInvokedCallback = null;
        }
        updateChecker.shutdownNow();
        goatRequestWorker.shutdownNow();
        disposeWebView(webView);
        super.onDestroy();
    }

    private static class NavigationWebViewClient extends WebViewClient {
        protected final MainActivity activity;

        NavigationWebViewClient(MainActivity activity) {
            this.activity = activity;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return activity.openExternalUrl(url);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (request != null && request.getUrl() != null) {
                return activity.openExternalUrl(request.getUrl().toString());
            }
            return false;
        }
    }

    // RenderProcessGoneDetail/onRenderProcessGone were added in API 26. Keep that
    // type out of the API-24/25 WebViewClient loaded on older Android releases.
    private static final class Api26 {
        static WebViewClient createWebViewClient(MainActivity activity) {
            return new RenderAwareWebViewClient(activity);
        }

        private static final class RenderAwareWebViewClient extends NavigationWebViewClient {
            RenderAwareWebViewClient(MainActivity activity) {
                super(activity);
            }

            @Override
            public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
                return activity.onRenderProcessGone(view);
            }
        }
    }

    // Keep newer framework API references out of the base Activity methods so
    // class verification on API 24-28 doesn't eagerly resolve them.
    private static final class Api29 {
        static void disableSystemBarContrastEnforcement(Window window) {
            try {
                window.setStatusBarContrastEnforced(false);
                window.setNavigationBarContrastEnforced(false);
            } catch (Throwable ignored) {
            }
        }
    }

    private static final class Api30 {
        static void configureEdgeToEdge(Window window) {
            try {
                window.setDecorFitsSystemWindows(false);
                WindowInsetsController controller = window.getInsetsController();
                if (controller != null) {
                    int lightBarMask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                    controller.setSystemBarsAppearance(0, lightBarMask);
                }
            } catch (Throwable ignored) {
            }
        }
    }

    private static final class Api33 {
        static Object register(final MainActivity activity) {
            try {
                Class<?> cbCls = Class.forName("android.window.OnBackInvokedCallback");
                Class<?> dispCls = Class.forName("android.window.OnBackInvokedDispatcher");
                Object disp = Activity.class.getMethod("getOnBackInvokedDispatcher").invoke(activity);
                if (disp == null) return null;
                Object callback = java.lang.reflect.Proxy.newProxyInstance(
                    cbCls.getClassLoader(),
                    new Class<?>[]{cbCls},
                    new java.lang.reflect.InvocationHandler() {
                        @Override
                        public Object invoke(Object proxy, java.lang.reflect.Method m, Object[] args) {
                            String name = m.getName();
                            if ("onBackInvoked".equals(name)) {
                                activity.handleBack();
                                return null;
                            }
                            if ("equals".equals(name)) {
                                return Boolean.valueOf(proxy == (args != null && args.length > 0 ? args[0] : null));
                            }
                            if ("hashCode".equals(name)) {
                                return Integer.valueOf(System.identityHashCode(proxy));
                            }
                            if ("toString".equals(name)) {
                                return "CaminoBackInvokedCallback";
                            }
                            return null;
                        }
                    });
                // PRIORITY_DEFAULT is the integer value 0; avoid statically linking the API-33 type.
                dispCls.getMethod("registerOnBackInvokedCallback", int.class, cbCls)
                    .invoke(disp, 0, callback);
                return callback;
            } catch (Throwable ignored) {
                return null;
            }
        }

        static void unregister(MainActivity activity, Object callback) {
            if (callback == null) return;
            try {
                Class<?> cbCls = Class.forName("android.window.OnBackInvokedCallback");
                Class<?> dispCls = Class.forName("android.window.OnBackInvokedDispatcher");
                Object disp = Activity.class.getMethod("getOnBackInvokedDispatcher").invoke(activity);
                if (disp != null) {
                    dispCls.getMethod("unregisterOnBackInvokedCallback", cbCls)
                        .invoke(disp, callback);
                }
            } catch (Throwable ignored) {
            }
        }
    }
}
