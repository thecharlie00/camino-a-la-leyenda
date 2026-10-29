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
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedDispatcher;

public final class MainActivity extends Activity {
    private WebView webView;
    // Object avoids resolving the API-33 callback type on devices below API 33.
    private Object backInvokedCallback;

    public class Bridge {
        @JavascriptInterface
        public void copy(final String text) {
            if (text == null || text.length() > 2000000) return;
            runOnUiThread(new Runnable() {
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
            runOnUiThread(new Runnable() {
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
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
            } catch (Throwable ignored) {
                return 61;
            }
        }

        @JavascriptInterface
        public int updateAvailable() {
            return 0;
        }

        @JavascriptInterface
        public String updateName() {
            return "";
        }

        @JavascriptInterface
        public void openStore() {
            runOnUiThread(new Runnable() {
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
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureEdgeToEdge();

        try {
            webView = new WebView(this);
            webView.setBackgroundColor(Color.rgb(11, 20, 23));
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    if (url != null && url.startsWith("file:///android_asset/")) {
                        return false;
                    }
                    if (url != null && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:"))) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                        } catch (Throwable ignored) {}
                    }
                    return true;
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    if (request != null && request.getUrl() != null) {
                        return shouldOverrideUrlLoading(view, request.getUrl().toString());
                    }
                    return false;
                }

                @Override
                public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                    if (webView != null) {
                        try {
                            if (webView.getParent() instanceof android.view.ViewGroup) {
                                ((android.view.ViewGroup) webView.getParent()).removeView(webView);
                            }
                            webView.destroy();
                        } catch (Throwable ignored) {}
                        webView = null;
                    }
                    finish();
                    return true;
                }
            });
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

            webView.addJavascriptInterface(new Bridge(), "AndroidBridge");
            setContentView(webView);

            if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null || webView.getUrl() == null) {
                webView.loadUrl("file:///android_asset/jugar/juego.html");
            }
            registerPredictiveBack();
        } catch (Throwable t) {
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
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
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
                int priority = OnBackInvokedDispatcher.PRIORITY_DEFAULT;
                dispCls.getMethod("registerOnBackInvokedCallback", int.class, cbCls)
                    .invoke(disp, priority, callback);
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
