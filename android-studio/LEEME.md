# Camino a la Leyenda — proyecto de Android Studio

El proyecto tiene **dos versiones** (en Android Studio se llaman *build variants*):

| Variante        | Qué es                                                    |
|-----------------|-----------------------------------------------------------|
| `noadsRelease`  | **Sin anuncios.** La que publicas ahora en Google Play.   |
| `adsRelease`    | Con anuncios de AdMob (para cuando quieras activarlos).   |

Las dos traen el **aviso de actualización**: al abrir el juego, la app pregunta a Google Play si hay una
versión nueva y, si la hay, enseña un aviso con el botón **Actualizar** que abre la ficha de la app en Play Store.

## 1. Abrirlo
1. **File → Open** → elige esta carpeta (`android-studio`).
2. Espera al *Gradle sync* (la primera vez descarga las librerías de Google). Si pide instalar el SDK 36, acepta.

## 2. Generar el .aab SIN anuncios (el de ahora)
1. **Build → Generate Signed App Bundle or APK → Android App Bundle → Next**.
2. Keystore: `camino.keystore` · alias `camino`. Las contraseñas están en `signing.properties` (este archivo no se sube a git: guárdalo junto al keystore).
3. En la lista de variantes elige **noadsRelease** → **Create**.
4. El archivo sale en `app/noads/release/app-noads-release.aab`.

Desde terminal: `./gradlew bundleNoadsRelease` → `app/build/outputs/bundle/noadsRelease/app-noads-release.aab`.

## 3. Cada versión nueva
- Sube `versionCode` (y `versionName`) en `app/build.gradle` antes de generar el .aab.
- Súbelo a Play Console. Cuando Google lo apruebe, a quien tenga la versión anterior le saldrá el aviso al abrir el juego.
- La comprobación principal usa Google Play. Si Play Core no detecta una actualización (por ejemplo, en una APK instalada a mano), la app intenta comprobar la versión pública de la ficha de Play Store; esa alternativa solo funciona si la ficha y su versión son públicas.
- Para probarlo antes de publicar: Play Console → *Compartir apps internamente*, instala una versión y luego sube otra con un `versionCode` mayor.

## 4. Cuando quieras anuncios
1. Haz los pasos de AdMob (cuenta, app, bloque intersticial y mensaje de consentimiento RGPD).
2. Pon tus ID en `gradle.properties` (`ADMOB_APP_ID` y `ADMOB_INTERSTITIAL_ID`).
3. Genera el .aab eligiendo la variante **adsRelease**.
4. En Play Console: Anuncios → Sí, actualiza Seguridad de los datos y la política de privacidad.
En pruebas (variante `adsDebug` con ▶ Run) siempre salen anuncios de prueba. Nunca pulses tus anuncios reales.

## 5. Actualizar el juego
Los juegos están en `app/src/noads/assets/index.html` y `app/src/ads/assets/index.html`.
`python3 build.py` (en la carpeta principal) los regenera y los copia aquí.
