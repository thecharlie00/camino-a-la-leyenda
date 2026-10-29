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

assert.match(manifest, /android:minSdkVersion="24"\s+android:targetSdkVersion="36"/);
assert.match(manifest, /android:versionCode="61"/);
assert.match(manifest, /android:versionName="5\.11"/);
assert.equal(packageJson.version, '5.11.0');
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
assert.match(activity, /private static final class Api30/);
assert.match(activity, /private static final class Api33/);
assert.match(activity, /private Object backInvokedCallback/);
assert.match(activity, /OnBackInvokedDispatcher\.PRIORITY_DEFAULT/);
assert.match(activity, /onConfigurationChanged\(Configuration newConfig\)/);
assert.match(activity, /setAllowUniversalAccessFromFileURLs\(false\)/);
assert.match(activity, /setMixedContentMode\(WebSettings\.MIXED_CONTENT_NEVER_ALLOW\)/);

assert.match(aabBuilder, /MANIFEST_TARGET_SDK/);
assert.match(aabBuilder, /"\$AAPT2" compile --dir res -o build-aab\/resources\.zip/, 'AAB builder must compile launcher resources');
assert.match(aabBuilder, /-R build-aab\/resources\.zip/, 'AAB link must include the compiled launcher icon');
assert.match(aabBuilder, /dist\/android\/jugar\/juego\.html/, 'AAB builder must package the Android-only startup artifact');
assert.match(aabBuilder, /--target-sdk-version "\$TARGET_SDK_VERSION"/);
assert.match(aabBuilder, /TARGET_SDK_VERSION must match AndroidManifest\.xml/);
assert.match(workflow, /BUILD_TOOLS: "36\.0\.0"/);
assert.match(workflow, /PLATFORM: "android-36"/);
assert.doesNotMatch(apkBuilder, /android-23|index-noads\.html|dalvik-exchange/);
assert.match(apkBuilder, /--mode=universal/);
assert.match(gameBuilder, /viewport-fit=cover/);
assert.match(gameCss, /safe-area-inset-top/);
assert.match(gameCss, /safe-area-inset-bottom/);

console.log('Android API 36 manifest, builders, edge-to-edge, large screens and back-navigation checks passed.');
