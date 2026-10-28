#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/android"

: "${ANDROID_JAR:?Set ANDROID_JAR to the Android platform android.jar}"
: "${AAPT2:?Set AAPT2 to the Android aapt2 executable}"
: "${D8:?Set D8 to the Android d8 executable}"
: "${BUNDLETOOL_JAR:?Set BUNDLETOOL_JAR to bundletool-all.jar}"
: "${CAMINO_KS_PASS:?Missing CAMINO_KS_PASS}"
KEYSTORE="${CAMINO_KEYSTORE:-$ROOT/android/camino.keystore}"
KEY_ALIAS="${CAMINO_KEY_ALIAS:-camino}"
VERSION_CODE="${VERSION_CODE:-$(sed -n 's/.*android:versionCode="\([0-9]*\)".*/\1/p' AndroidManifest.xml)}"
VERSION_NAME="${VERSION_NAME:-$(sed -n 's/.*android:versionName="\([^"]*\)".*/\1/p' AndroidManifest.xml)}"

if [[ ! -s "$KEYSTORE" ]]; then
  echo "Keystore not found or empty: $KEYSTORE" >&2
  exit 1
fi
if [[ ! -f "$ROOT/dist/jugar/juego.html" ]]; then
  echo "Game entry point missing; run npm run build first." >&2
  exit 1
fi

rm -rf build-aab assets
mkdir -p build-aab/{classes,dex,module} "$ROOT/dist" assets/jugar
# The game HTML is self-contained (3D models, CSS, music and pet engine inline).
cp "$ROOT/dist/jugar/juego.html" assets/jugar/juego.html

# Create an Android proto-APK to supply the base module manifest and packaged assets.
"$AAPT2" link \
  --proto-format \
  --min-sdk-version 24 \
  --target-sdk-version 35 \
  --version-code "$VERSION_CODE" \
  --version-name "$VERSION_NAME" \
  -I "$ANDROID_JAR" \
  --manifest AndroidManifest.xml \
  -A assets \
  -o build-aab/base.apk

javac -encoding UTF-8 -source 8 -target 8 \
  -bootclasspath "$ANDROID_JAR" \
  -classpath "$ANDROID_JAR" \
  -d build-aab/classes \
  src/com/caminoleyenda/app/MainActivity.java

mapfile -d '' CLASS_FILES < <(find build-aab/classes -name '*.class' -print0)
"$D8" --min-api 24 --lib "$ANDROID_JAR" --output build-aab/dex "${CLASS_FILES[@]}"

unzip -q build-aab/base.apk -d build-aab/module
mkdir -p build-aab/module/manifest build-aab/module/dex
mv build-aab/module/AndroidManifest.xml build-aab/module/manifest/AndroidManifest.xml
cp build-aab/dex/classes.dex build-aab/module/dex/classes.dex
(
  cd build-aab/module
  zip -q -r ../base.zip .
)

java -jar "$BUNDLETOOL_JAR" build-bundle \
  --modules=build-aab/base.zip \
  --output=build-aab/app-unsigned.aab \
  --overwrite
jarsigner \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore "$KEYSTORE" \
  -storepass "$CAMINO_KS_PASS" \
  -keypass "$CAMINO_KS_PASS" \
  -signedjar "$ROOT/dist/CaminoALaLeyenda.aab" \
  build-aab/app-unsigned.aab \
  "$KEY_ALIAS"
jarsigner -verify "$ROOT/dist/CaminoALaLeyenda.aab" >/dev/null

echo "AAB firmado: $ROOT/dist/CaminoALaLeyenda.aab ($(du -h "$ROOT/dist/CaminoALaLeyenda.aab" | cut -f1))"
