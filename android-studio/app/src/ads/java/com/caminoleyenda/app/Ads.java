package com.caminoleyenda.app;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import java.util.concurrent.atomic.AtomicBoolean;

/* Versión con anuncios: consentimiento (UMP, obligatorio en el EEE / Reino Unido / Suiza) + intersticiales de AdMob. */
final class Ads {
    private final Activity act;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final AtomicBoolean started = new AtomicBoolean(false);
    private ConsentInformation consent;
    private volatile InterstitialAd interstitial;
    private boolean loading;
    private int retry;

    Ads(Activity a) { act = a; }

    void start() {
        consent = UserMessagingPlatform.getConsentInformation(act);
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
        consent.requestConsentInfoUpdate(act, params,
            () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(act, formError -> {
                if (consent.canRequestAds()) init();
            }),
            requestError -> { if (consent.canRequestAds()) init(); });
        /* si ya dio su consentimiento en otra sesión, no hace falta esperar */
        if (consent.canRequestAds()) init();
    }

    private void init() {
        if (started.getAndSet(true)) return;
        new Thread(() -> MobileAds.initialize(act, status -> main.post(this::load))).start();
    }

    private void load() {
        if (loading || interstitial != null || act.isFinishing()) return;
        loading = true;
        String unit = BuildConfig.AD_UNIT_INTERSTITIAL;
        InterstitialAd.load(act, unit, new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
            @Override
            public void onAdLoaded(InterstitialAd ad) {
                loading = false; retry = 0;
                ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override
                    public void onAdDismissedFullScreenContent() { interstitial = null; load(); }
                    @Override
                    public void onAdFailedToShowFullScreenContent(AdError e) { interstitial = null; load(); }
                });
                interstitial = ad;
            }

            @Override
            public void onAdFailedToLoad(LoadAdError e) {
                loading = false; interstitial = null;
                /* sin conexión o sin anuncios: se reintenta cada vez más tarde (30 s, 1 min, 2 min… hasta 10 min) */
                long wait = Math.min(600000L, 30000L << Math.min(retry++, 5));
                main.postDelayed(Ads.this::load, wait);
            }
        });
    }

    /* true si había un anuncio listo y se va a mostrar (se llama desde cualquier hilo) */
    boolean show() {
        if (interstitial == null) return false;
        act.runOnUiThread(() -> {
            InterstitialAd ad = interstitial;
            if (ad != null && !act.isFinishing()) ad.show(act);
        });
        return true;
    }

    boolean privacyOptionsRequired() {
        return consent != null && consent.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
    }

    void showPrivacyOptions() {
        act.runOnUiThread(() -> UserMessagingPlatform.showPrivacyOptionsForm(act, formError -> { }));
    }

    void destroy() { main.removeCallbacksAndMessages(null); }
}
