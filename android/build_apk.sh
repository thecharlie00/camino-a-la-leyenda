#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
: "${CAMINO_KS_PASS:?Set CAMINO_KS_PASS to the signing-key password}"
KEYSTORE="${CAMINO_KEYSTORE:-$ROOT/android/camino.keystore}"
KEY_ALIAS="${CAMINO_KEY_ALIAS:-camino}"
BUNDLETOOL_VERSION="${BUNDLETOOL_VERSION:-1.18.3}"

if [[ ! -s "$KEYSTORE" ]]; then
  echo "Keystore not found or empty: $KEYSTORE" >&2
  exit 1
fi
if [[ ! -f "${BUNDLETOOL_JAR:-}" ]]; then
  BUNDLETOOL_JAR="$ROOT/.cache/bundletool-all-$BUNDLETOOL_VERSION.jar"
  mkdir -p "$(dirname "$BUNDLETOOL_JAR")"
  curl -fsSL -o "$BUNDLETOOL_JAR" \
    "https://github.com/google/bundletool/releases/download/$BUNDLETOOL_VERSION/bundletool-all-$BUNDLETOOL_VERSION.jar"
fi

bash "$ROOT/android/build_aab.sh"

APKS="$ROOT/dist/CaminoALaLeyenda.apks"
java -jar "$BUNDLETOOL_JAR" build-apks \
  --bundle="$ROOT/dist/CaminoALaLeyenda.aab" \
  --output="$APKS" \
  --mode=universal \
  --ks="$KEYSTORE" \
  --ks-pass="pass:$CAMINO_KS_PASS" \
  --ks-key-alias="$KEY_ALIAS" \
  --key-pass="pass:$CAMINO_KS_PASS" \
  --overwrite
unzip -p "$APKS" universal.apk > "$ROOT/dist/CaminoALaLeyenda.apk"
echo "APK universal firmada: $ROOT/dist/CaminoALaLeyenda.apk ($(du -h "$ROOT/dist/CaminoALaLeyenda.apk" | cut -f1))"
