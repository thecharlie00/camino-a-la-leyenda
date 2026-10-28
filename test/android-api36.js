import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
assert.match(manifest, /android:versionCode="59"/);
assert.match(manifest, /android:versionName="5\.9"/);
assert.equal(packageJson.version, '5.9.0');
assert.equal(packageLock.version, packageJson.version);
assert.equal(packageLock.packages[''].version, packageJson.version);
assert.match(manifest, /android:resizeableActivity="true"/);
assert.match(manifest, /android:enableOnBackInvokedCallback="true"/);
assert.doesNotMatch(manifest, /android:screenOrientation=/, 'Android 16 large-screen windows must not be locked to portrait');
assert.match(manifest, /screenLayout\|screenSize\|smallestScreenSize/);

assert.match(activity, /window\.setDecorFitsSystemWindows\(false\)/);
assert.match(activity, /OnBackInvokedDispatcher\.PRIORITY_DEFAULT/);
assert.match(activity, /onConfigurationChanged\(Configuration newConfig\)/);
assert.match(activity, /setAllowUniversalAccessFromFileURLs\(false\)/);
assert.match(activity, /setMixedContentMode\(WebSettings\.MIXED_CONTENT_NEVER_ALLOW\)/);

assert.match(aabBuilder, /MANIFEST_TARGET_SDK/);
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
