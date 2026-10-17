#!/usr/bin/env python3
"""Empaqueta el juego en un único HTML (artifact) y en un documento completo para la APK."""
import base64, pathlib

ROOT = pathlib.Path(__file__).parent
import os
SRC = pathlib.Path(os.environ["CAMINO_SRC"]) if os.environ.get("CAMINO_SRC") else ROOT / "src"
FONTS = ROOT / "fonts" / "node_modules" / "@fontsource"
DIST = pathlib.Path(os.environ["CAMINO_DIST"]) if os.environ.get("CAMINO_DIST") else ROOT / "dist"

faces = [
    ("Big Shoulders Display", "big-shoulders-display", 800, ["latin"]),
    ("Big Shoulders Display", "big-shoulders-display", 900, ["latin"]),
    ("Archivo", "archivo", 400, ["latin", "latin-ext"]),
    ("Archivo", "archivo", 600, ["latin", "latin-ext"]),
    ("Archivo", "archivo", 700, ["latin", "latin-ext"]),
    ("Archivo", "archivo", 800, ["latin"]),
    ("Doto", "doto", 900, ["latin"]),
]
RANGES = {
    "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
}
css_fonts = []
for fam, pkg, w, subsets in faces:
    for sub in subsets:
        f = FONTS / pkg / "files" / f"{pkg}-{sub}-{w}-normal.woff2"
        data = base64.b64encode(f.read_bytes()).decode()
        css_fonts.append(
            f'@font-face{{font-family:"{fam}";font-style:normal;font-weight:{w};font-display:swap;'
            f'src:url(data:font/woff2;base64,{data}) format("woff2");unicode-range:{RANGES[sub]}}}'
        )

css = "\n".join(css_fonts) + "\n" + (SRC / "style.css").read_text()
LANG_FILES = ["lang-en.js", "lang-de.js", "lang-it.js", "lang-fr.js", "lang-fem.js"]
ORDER = ["i18n.js"] + LANG_FILES + ["data.js", "data-es.js", "data-f.js", "names.js", "real.js", "real-f.js", "engine-core.js", "engine-player.js", "events.js", "events-extra.js", "events-more.js", "trophies.js", "engine-manager.js", "events-manager.js", "events-manager-extra.js", "events-manager-more.js", "engine-modes.js", "press-data.js", "social-data.js", "engine-extra.js", "engine-market.js", "press-ctx.js", "draw.js", "shootout.js", "life.js", "mgr-plus.js", "market26.js", "pets.js", "achieve.js", "ach36.js", "week29.js", "club30.js", "nat31.js", "chal32.js", "story33.js", "edit35.js", "squad37.js", "match41.js", "crest.js", "faces.js", "minigame.js", "bolas.js", "pitch.js", "ui.js", "ui-press.js", "ui-draw.js", "ui-shootout.js", "ui-life.js", "ui-pets.js", "ui-mgrplus.js", "ui-guide.js", "ui-steps.js", "ui-cups.js", "ui-week.js", "ui-club30.js", "ui-chal32.js", "ui-story33.js", "ui-35.js", "ui-37.js", "ui-41.js", "ui-boot.js"]
js = "\n".join((SRC / n).read_text() for n in ORDER if (SRC / n).exists())
# etiqueta de versión: nombre y código de la app Android y la fecha de compilación
import re as _re, datetime as _dt
_man = (ROOT / "android" / "AndroidManifest.xml").read_text() if (ROOT / "android" / "AndroidManifest.xml").exists() else ""
_vn = (_re.search(r'versionName="([^"]+)"', _man) or [None, "?"])[1]
_vc = (_re.search(r'versionCode="(\d+)"', _man) or [None, "0"])[1]
js = 'var BUILD = {v: "%s", code: %s, t: "%s"};\n' % (_vn, _vc, _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")) + js
js = js.replace("</script", "<\\/script")

ICON = base64.b64encode((SRC / "icon96.png").read_bytes()).decode() if (SRC / "icon96.png").exists() else ""
body = f"""<title>Fútbol: Camino a la Leyenda</title>
<link rel="icon" href="data:image/png;base64,{ICON}">
<link rel="apple-touch-icon" href="data:image/png;base64,{ICON}">
<meta name="theme-color" content="#0b1417">
<style>
{css}
</style>
<div id="app"></div>
<script>
{js}
</script>
"""
DIST.mkdir(exist_ok=True)
(DIST / "camino.html").write_text(body.replace("var NO_ADS = false;", "var NO_ADS = true;"))  # la web no tiene anuncios

full = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">
{body.split('<div id="app">')[0]}</head>
<body>
<div id="app"></div>
<script>
{js}
</script>
</body>
</html>
"""
(DIST / "index.html").write_text(full)
# versión sin anuncios (APK/AAB hechos aquí, sin el SDK de AdMob)
NOADS_MARK = "var NO_ADS = false;"
assert full.count(NOADS_MARK) == 1, "falta la marca NO_ADS"
(DIST / "index-noads.html").write_text(full.replace(NOADS_MARK, "var NO_ADS = true;"))
print("camino.html", round(len(body) / 1024), "KB · index.html", round(len(full) / 1024), "KB")
# proyecto de Android Studio: versión con anuncios (ads) y sin anuncios (noads)
ASRC = pathlib.Path(__file__).parent / "android-studio" / "app" / "src"
if ASRC.is_dir():
    for flavor, html in (("ads", full), ("noads", full.replace(NOADS_MARK, "var NO_ADS = true;"))):
        (ASRC / flavor / "assets").mkdir(parents=True, exist_ok=True)
        (ASRC / flavor / "assets" / "index.html").write_text(html)
