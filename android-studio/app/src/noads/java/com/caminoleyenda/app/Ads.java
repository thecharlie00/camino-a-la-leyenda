package com.caminoleyenda.app;

import android.app.Activity;

/* Versión sin anuncios: no hace nada. */
final class Ads {
    Ads(Activity a) { }
    void start() { }
    boolean show() { return false; }
    boolean privacyOptionsRequired() { return false; }
    void showPrivacyOptions() { }
    void destroy() { }
}
