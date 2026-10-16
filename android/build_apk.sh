#!/bin/bash
. "$(dirname "$0")/signing.env" 2>/dev/null; : "${CAMINO_KS_PASS:?Falta la contraseña: crea android/signing.env con CAMINO_KS_PASS=...}"
# Compila la APK firmada a partir de dist/index.html
set -e
cd "$(dirname "$0")"
SDK=/usr/lib/android-sdk/platforms/android-23/android.jar
rm -rf build && mkdir -p build/gen build/obj build/apk assets
cp ../dist/index-noads.html assets/index.html
aapt package -f -m -J build/gen -M AndroidManifest.xml -S res -I "$SDK"
javac -nowarn -source 8 -target 8 -bootclasspath "$SDK" -classpath "$SDK" -d build/obj build/gen/com/caminoleyenda/app/R.java src/com/caminoleyenda/app/MainActivity.java src/com/caminoleyenda/app/Remind.java 2>&1 | grep -v "warning" || true
dalvik-exchange --dex --min-sdk-version=24 --output=build/apk/classes.dex build/obj
aapt package -f -M AndroidManifest.xml -S res -A assets -I "$SDK" -F build/unsigned.apk
(cd build/apk && aapt add ../unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 build/unsigned.apk build/aligned.apk
[ -f camino.keystore ] || keytool -genkeypair -keystore camino.keystore -storepass $CAMINO_KS_PASS -keypass $CAMINO_KS_PASS -alias camino -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Camino a la Leyenda, O=Camino, C=ES" 2>/dev/null
apksigner sign --ks camino.keystore --ks-pass pass:"$CAMINO_KS_PASS" --key-pass pass:"$CAMINO_KS_PASS" --ks-key-alias camino --out ../dist/CaminoALaLeyenda.apk build/aligned.apk
apksigner verify ../dist/CaminoALaLeyenda.apk && echo "APK firmada: $(du -h ../dist/CaminoALaLeyenda.apk | cut -f1)"
