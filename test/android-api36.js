import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const manifest = read('../android/AndroidManifest.xml');
const packageJson = JSON.parse(read('../package.json'));
const packageLock = JSON.parse(read('../package-lock.json'));
const activity = read('../android/src/com/caminoleyenda/app/MainActivity.java');
const aabBuilder = read('../android/build_aab.sh');
const apkBuilder = read('../android/build_apk.sh');
const workflow = read('../.github/workflows/build.yml');
const gameBuilder = read('../build_legacy_game.py');
const gameCss = read('../legacy-game/src/style.css');
const gameUi = read('../legacy-game/src/ui.js');
const playStoreFeed = JSON.parse(read('../public/play-store-version.json'));

assert.match(manifest, /android:minSdkVersion="24"\s+android:targetSdkVersion="36"/);
assert.match(manifest, /android:versionCode="71"/);
assert.match(manifest, /android:versionName="5\.21"/);
assert.equal(packageJson.version, '5.21.0');
assert.equal(packageLock.version, packageJson.version);
assert.equal(packageLock.packages[''].version, packageJson.version);
assert.match(manifest, /android:resizeableActivity="true"/);
assert.match(manifest, /android:enableOnBackInvokedCallback="true"/);
assert.match(manifest, /android:icon="@mipmap\/ic_launcher"/);
for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  const icon = new URL(`../android/res/mipmap-${density}/ic_launcher.png`, import.meta.url);
  assert.ok(existsSync(icon), `Missing ${density} launcher icon`);
  assert.deepEqual(readFileSync(icon).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}
assert.doesNotMatch(manifest, /android:screenOrientation=/, 'Android 16 large-screen windows must not be locked to portrait');
assert.match(manifest, /screenLayout\|screenSize\|smallestScreenSize/);

assert.match(manifest, /android:hardwareAccelerated="true"/);
assert.doesNotMatch(activity, /setLayerType\(View\.LAYER_TYPE_HARDWARE/, 'Do not force a second hardware layer for the canvas-heavy WebView');
assert.match(activity, /window\.setDecorFitsSystemWindows\(false\)/);
assert.match(activity, /root\.setOnApplyWindowInsetsListener\(new View\.OnApplyWindowInsetsListener\(\)/,
  'Android must keep the game inside the system bars with a padded container (a WebView ignores its own padding)');
assert.match(activity, /root\.addView\(webView,/, 'The WebView must live inside the padded container');
assert.match(activity, /setContentView\(root\)/, 'The padded container must be the content view');
assert.match(activity, /view\.setPadding\(bars\[0\], bars\[1\], bars\[2\], bars\[3\]\)/, 'All four system-bar sides must be applied');
assert.match(activity, /WindowInsets\.Type\.systemBars\(\) \| WindowInsets\.Type\.displayCutout\(\)/, 'API 30+ must include status, navigation and cutout insets');
assert.match(activity, /insets\.getSystemWindowInsetTop\(\)/, 'API 28-29 must fall back to the system window insets');
assert.match(activity, /import android\.view\.WindowInsets;/, 'Safe-area handling must use the API 24-compatible WindowInsets type');
assert.match(activity, /private static final class Api26/);
assert.match(activity, /private static final class Api29/);
assert.match(activity, /private static final class Api30/);
assert.match(activity, /private static final class Api33/);
assert.match(activity, /private Object backInvokedCallback/);
assert.match(activity, /Proxy\.newProxyInstance/);
assert.match(activity, /Class\.forName\("android\.window\.OnBackInvokedCallback"\)/);
assert.match(activity, /Boolean\.valueOf\(proxy ==/);
assert.match(activity, /Integer\.valueOf\(System\.identityHashCode\(proxy\)\)/);
assert.doesNotMatch(activity, /import android\.window\.OnBackInvoked/);
assert.match(activity, /Build\.VERSION\.SDK_INT >= 26/);
const api26Start = activity.indexOf('private static final class Api26');
const api29Start = activity.indexOf('private static final class Api29');
assert.ok(api26Start >= 0 && api29Start > api26Start);
assert.match(activity.slice(api26Start, api29Start), /onRenderProcessGone\(WebView view, android\.webkit\.RenderProcessGoneDetail detail\)/);
assert.doesNotMatch(activity.slice(0, api26Start), /import .*RenderProcessGoneDetail|onRenderProcessGone\(WebView view,/);
for (const method of ['copy', 'haptic', 'versionCode', 'updateAvailable', 'updateName', 'openStore', 'showAd', 'privacyOptionsRequired', 'showPrivacyOptions', 'remind', 'cancelRemind', 'askNotify', 'goatCareerPost']) {
  assert.match(activity, new RegExp(`@JavascriptInterface\\s+public\\s+[^\\n]+\\b${method}\\s*\\(`), `Missing AndroidBridge method ${method}`);
}
assert.match(activity, /ADMOB_INTERSTITIAL_ID = "ca-app-pub-3919867907492197\/1191061575"/);
assert.match(activity, /TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544\/1033173712"/);
assert.match(activity, /BuildConfig\.DEBUG \? TEST_INTERSTITIAL_ID : ADMOB_INTERSTITIAL_ID/);
assert.match(activity, /if \(!"menu"\.equals\(where\)\) return;/, 'Native bridge must reject every placement except the safe return-to-menu transition');
assert.match(activity, /MIN_INTERSTITIAL_INTERVAL_MS = 5L \* 60L \* 1000L/);
assert.match(activity, /consentInformation\.requestConsentInfoUpdate/);
assert.match(activity, /loadAndShowConsentFormIfRequired/);
assert.match(activity, /showPrivacyOptionsForm/);
assert.match(activity, /info\.canRequestAds\(\)/);
assert.match(activity, /onAdDismissedFullScreenContent/);
const goatOrigin = gameBuilder.match(/DEFAULT_GOAT_API_URL = "([^"]+)"/)[1];
assert.ok(activity.includes(`GOAT_CAREER_URL = "${goatOrigin}/api/goat-ladder/careers"`),
  'Android native career requests must match the game-configured GOAT API');
assert.match(activity, /connection\.setRequestMethod\("POST"\)/);
assert.match(activity, /connection\.setRequestProperty\("Content-Type", contentType\)/);
assert.match(activity, /MAX_GOAT_REQUEST_BYTES = 100000/);
assert.match(activity, /completeGoatCareerRequest\(requestId, status, responseBody\)/);
assert.equal(playStoreFeed.packageName, 'com.caminoleyenda.app');
assert.ok(playStoreFeed.versionCode > 0 && playStoreFeed.versionName);
assert.ok(playStoreFeed.versionCode <= Number(manifest.match(/android:versionCode="([0-9]+)"/)[1]),
  'The Play release pointer must not announce a build newer than the app package');
assert.match(activity, /PLAY_RELEASE_URL = "https:\/\/futbolroadtolegend\.com\/play-store-version\.json"/);
assert.match(activity, /private void checkForPlayStoreUpdate\(\)/);
assert.match(activity, /latestCode > installedVersionCode\(\)/,
  'Only a Play-published version newer than the installed build may trigger the notice');
assert.match(activity, /notifyWebOfUpdate\(\)/);
assert.match(activity, /checkForPlayStoreUpdate\(\);/);
assert.doesNotMatch(activity, /public int updateAvailable\(\)\s*\{\s*return 0;/,
  'AndroidBridge must return the checked Play Store version rather than a stub');
assert.match(gameUi, /window\.caminoUpdate = function \(code, name\)/);
assert.match(gameUi, /data-a=.*doupdate/);
assert.match(gameUi, /case \"doupdate\": try \{ window\.AndroidBridge\.openStore\(\);/);
assert.match(activity, /onConfigurationChanged\(Configuration newConfig\)/);
assert.match(activity, /setAllowUniversalAccessFromFileURLs\(false\)/);
assert.match(activity, /setMixedContentMode\(WebSettings\.MIXED_CONTENT_NEVER_ALLOW\)/);

assert.match(manifest, /com\.google\.android\.gms\.ads\.APPLICATION_ID/);
assert.match(manifest, /ca-app-pub-3919867907492197~2991228409/);
assert.match(aabBuilder, /Gradle is required/);
assert.match(aabBuilder, /:app:bundleRelease/);
assert.match(aabBuilder, /outputs\/bundle\/release\/app-release\.aab/);
assert.match(aabBuilder, /dist\/android\/jugar\/juego\.html/, 'AAB builder must package the Android-only startup artifact');
assert.doesNotMatch(aabBuilder, /AAPT2|BUNDLETOOL_JAR|MANIFEST_TARGET_SDK/, 'AdMob dependency resolution is handled by Gradle, not the old manual packager');
const gradleConfig = read('../android/app/build.gradle');
const settingsGradle = read('../android/settings.gradle');
assert.match(gradleConfig, /play-services-ads:24\.7\.0/);
assert.match(gradleConfig, /user-messaging-platform:3\.2\.0/);
assert.match(gradleConfig, /compileSdk 37/);
assert.match(gradleConfig, /targetSdk 36/, 'Keep Android 17 runtime behavior opt-in until it is tested');
assert.match(gradleConfig, /buildToolsVersion '37\.0\.0'/);
assert.match(gradleConfig, /prepareVariantGameAssets/);
assert.match(gradleConfig, /generated\/game-assets\/\$\{variant\.name\}/);
assert.match(gradleConfig, /variant\.sources\.assets\?\.addGeneratedSourceDirectory/,
  'Generated Android assets must use the AGP Variant Sources API');
assert.match(gradleConfig, /PrepareGameAssetsTask::getOutputDirectory/);
assert.match(gradleConfig, /@OutputDirectory\s+abstract DirectoryProperty getOutputDirectory\(\)/);
assert.match(settingsGradle, /include ':app'/);
assert.match(activity, /webView\.getUrl\(\) == null/, 'State restoration must reload the game when the saved URL is empty');
assert.match(activity, /webView\.addJavascriptInterface\(new Bridge\(\), "AndroidBridge"\)/);
assert.match(activity, /shouldOverrideUrlLoading\(WebView view, WebResourceRequest request\)/);
assert.match(activity, /Intent\.ACTION_VIEW/);
assert.match(activity, /onRenderProcessGone\(WebView view, android\.webkit\.RenderProcessGoneDetail detail\)/);
assert.match(workflow, /gradle\/actions\/setup-gradle@v4/);
assert.match(workflow, /gradle-version: "9\.6\.0"/);
assert.match(workflow, /BUILD_TOOLS: "37\.0\.0"/);
assert.match(workflow, /PLATFORM: "android-37\.0"/);
assert.match(read('../android/build.gradle'), /com\.android\.application' version '9\.5\.0'/);
for (const policyPath of [
  '../privacidad/app/index.html', '../privacidad/index.html', '../en/privacidad/index.html',
  '../de/privacidad/index.html', '../fr/privacidad/index.html', '../it/privacidad/index.html'
]) {
  const policy = read(policyPath);
  assert.match(policy, /AdMob/);
  assert.match(policy, /never during matches?|nunca durante (los partidos|(un )?partido)|niemals während eines Spiels|jamais pendant un match|mai durante una partita/i,
    `Policy must explain that ads never interrupt matches: ${policyPath}`);
  assert.doesNotMatch(policy, /does not show ads|no muestra anuncios|zeigt keine Werbung|n'affiche pas de publicit|non mostra pubblicità/i,
    `Policy must not claim Android has no ads: ${policyPath}`);
}

assert.doesNotMatch(apkBuilder, /android-23|index-noads\.html|dalvik-exchange/);
assert.match(apkBuilder, /--mode=universal/);
assert.match(gameBuilder, /viewport-fit=cover/);
assert.match(gameCss, /safe-area-inset-top/);
assert.match(gameCss, /safe-area-inset-bottom/);
assert.match(gameCss, /@supports \(height: 100dvh\)/, 'App viewport should track modern dynamic screen heights');
assert.match(gameCss, /touch-action: pan-y; scroll-padding-block: 16px;/, 'Scrollable modal controls must remain touch-accessible');
assert.match(gameCss, /\.goat-board \.seg \{ width: 100%; grid-auto-columns: minmax\(0, 1fr\); \}/, 'GOAT filter groups must fit the modal width');
assert.match(gameCss, /\.goat-board \.seg button \{ min-width: 0; min-height: 44px; padding-inline: 4px; overflow-wrap: anywhere; touch-action: manipulation; \}/, 'GOAT filters must have mobile-sized touch targets');
assert.match(gameCss, /\.pickrow\.modec\.eras-mode \{[^}]*touch-action: manipulation;/, 'Era Mode selection must remain touch-accessible');

console.log('Android target API 36 / compile API 37 manifest, Gradle build, edge-to-edge, large screens and back-navigation checks passed.');
