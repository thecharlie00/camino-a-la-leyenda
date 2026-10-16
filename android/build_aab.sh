#!/bin/bash
. "$(dirname "$0")/signing.env" 2>/dev/null; : "${CAMINO_KS_PASS:?Falta la contraseña: crea android/signing.env con CAMINO_KS_PASS=...}"
# Compila el Android App Bundle (.aab) firmado con la clave de subida, a partir de dist/index.html
set -e
cd "$(dirname "$0")"
# Rutas configurables (en GitHub Actions las pone el workflow; aquí, los valores locales de siempre)
SDK=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
BT=${BUNDLETOOL_JAR:-../tools/bt/bundletool.jar}
AAPT2=${AAPT2:-aapt2}
KEYSTORE=${CAMINO_KEYSTORE:-camino.keystore}
rm -rf build-aab && mkdir -p build-aab/gen build-aab/obj build-aab/module assets
cp ../dist/index-noads.html assets/index.html
$AAPT2 compile --dir res -o build-aab/res.zip
$AAPT2 link --proto-format -o build-aab/base.apk -I "$SDK" --manifest AndroidManifest.xml -R build-aab/res.zip -A assets --auto-add-overlay --java build-aab/gen
javac -nowarn -source 8 -target 8 -bootclasspath "$SDK" -classpath "$SDK" -d build-aab/obj build-aab/gen/com/caminoleyenda/app/R.java src/com/caminoleyenda/app/MainActivity.java 2>build-aab/javac.log || { cat build-aab/javac.log; exit 1; }
grep -v warning build-aab/javac.log | grep -v "^Note:" || true
if [ -n "$D8" ]; then "$D8" --min-api 24 --lib "$SDK" --output build-aab $(find build-aab/obj -name '*.class'); else dalvik-exchange --dex --min-sdk-version=24 --output=build-aab/classes.dex build-aab/obj; fi
cd build-aab/module && unzip -q ../base.apk && mkdir -p manifest dex && mv AndroidManifest.xml manifest/ && cp ../classes.dex dex/ && zip -q -r ../base.zip . && cd ../..
java -jar "$BT" build-bundle --modules=build-aab/base.zip --output=build-aab/app.aab --overwrite
jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$KEYSTORE" -storepass $CAMINO_KS_PASS -keypass $CAMINO_KS_PASS -signedjar ../dist/CaminoALaLeyenda.aab build-aab/app.aab camino >/dev/null
jarsigner -verify ../dist/CaminoALaLeyenda.aab | tail -1
echo "AAB: $(du -h ../dist/CaminoALaLeyenda.aab | cut -f1)"
