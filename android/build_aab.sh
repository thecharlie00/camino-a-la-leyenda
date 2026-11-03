#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

: "${CAMINO_KS_PASS:?Missing CAMINO_KS_PASS}"
KEYSTORE="${CAMINO_KEYSTORE:-$ROOT/android/camino.keystore}"
KEY_ALIAS="${CAMINO_KEY_ALIAS:-camino}"
GRADLE_BIN="${GRADLE_BIN:-gradle}"
VERSION_CODE="${VERSION_CODE:-$(sed -n 's/.*android:versionCode="\([0-9]*\)".*/\1/p' android/AndroidManifest.xml)}"
VERSION_NAME="${VERSION_NAME:-$(sed -n 's/.*android:versionName="\([^"]*\)".*/\1/p' android/AndroidManifest.xml)}"

if [[ ! -s "$KEYSTORE" ]]; then
  echo "Keystore not found or empty: $KEYSTORE" >&2
  exit 1
fi
if [[ ! -f "$ROOT/dist/android/jugar/juego.html" ]]; then
  echo "Android game entry point missing; run npm run build first." >&2
  exit 1
fi
if ! command -v "$GRADLE_BIN" >/dev/null 2>&1; then
  echo "Gradle is required. Install Gradle 9.6+ and Android SDK platform 37.0/build-tools 37.0.0." >&2
  exit 1
fi

CAMINO_KEYSTORE="$KEYSTORE" \
CAMINO_KEY_ALIAS="$KEY_ALIAS" \
VERSION_CODE="$VERSION_CODE" \
VERSION_NAME="$VERSION_NAME" \
CAMINO_ADMOB_TEST_ADS="${CAMINO_ADMOB_TEST_ADS:-false}" \
"$GRADLE_BIN" --no-daemon --project-dir "$ROOT/android" :app:bundleRelease

AAB="$ROOT/android/app/build/outputs/bundle/release/app-release.aab"
if [[ ! -s "$AAB" ]]; then
  echo "Gradle completed without producing $AAB" >&2
  exit 1
fi
mkdir -p "$ROOT/dist"
cp "$AAB" "$ROOT/dist/CaminoALaLeyenda.aab"
jarsigner -verify "$ROOT/dist/CaminoALaLeyenda.aab" >/dev/null
echo "AAB firmado: $ROOT/dist/CaminoALaLeyenda.aab ($(du -h "$ROOT/dist/CaminoALaLeyenda.aab" | cut -f1))"
