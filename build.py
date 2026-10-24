#!/usr/bin/env python3
"""Empaqueta el juego en un único HTML (artifact) y en un documento completo para la APK."""
import base64, json, pathlib, re

ROOT = pathlib.Path(__file__).parent
import os
from urllib.parse import urlparse
SRC = pathlib.Path(os.environ["CAMINO_SRC"]) if os.environ.get("CAMINO_SRC") else ROOT / "src"
FONTS = ROOT / "fonts" / "node_modules" / "@fontsource"
DIST = pathlib.Path(os.environ["CAMINO_DIST"]) if os.environ.get("CAMINO_DIST") else ROOT / "dist"

faces = [
    # 5.6: tipografía legible. Atkinson Hyperlegible Next (OFL) para texto y cifras;
    # Pixelify Sans solo para las letras de títulos y botones (sus cifras salen de Atkinson).
    ("Atkinson Hyperlegible Next", "atkinson-hyperlegible-next", 400, ["latin", "latin-ext"]),
    ("Atkinson Hyperlegible Next", "atkinson-hyperlegible-next", 500, ["latin", "latin-ext"]),
    ("Atkinson Hyperlegible Next", "atkinson-hyperlegible-next", 700, ["latin", "latin-ext"]),
    ("Atkinson Hyperlegible Next", "atkinson-hyperlegible-next", 800, ["latin", "latin-ext"]),
    ("CamDisp", "pixelify-sans", 500, ["latin", "latin-ext"]),
    ("CamDisp", "pixelify-sans", 700, ["latin", "latin-ext"]),
    ("CamDisp", "atkinson-hyperlegible-next", 500, ["digits"]),
    ("CamDisp", "atkinson-hyperlegible-next", 700, ["digits"]),
]
RANGES = {
    # cifras y signos que acompañan a los números: siempre de Atkinson, nunca en pixel
    "digits": "U+0023-0025,U+002B-002E,U+0030-003A,U+20AC",
    "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
}
css_fonts = []
for fam, pkg, w, subsets in faces:
    for sub in subsets:
        f = FONTS / pkg / "files" / f"{pkg}-{'latin' if sub == 'digits' else sub}-{w}-normal.woff2"
        data = base64.b64encode(f.read_bytes()).decode()
        css_fonts.append(
            f'@font-face{{font-family:"{fam}";font-style:normal;font-weight:{w};font-display:swap;'
            f'src:url(data:font/woff2;base64,{data}) format("woff2");unicode-range:{RANGES[sub]}}}'
        )

css = "\n".join(css_fonts) + "\n" + (SRC / "style.css").read_text()
LANG_FILES = ["lang-en.js", "lang-de.js", "lang-it.js", "lang-fr.js", "lang-fem.js"]
ORDER = ["i18n.js"] + LANG_FILES + ["data.js", "data-es.js", "data-f.js", "data-45.js", "data-48.js", "names.js", "real.js", "real-f.js", "engine-core.js", "engine-player.js", "events.js", "events-extra.js", "events-more.js", "trophies.js", "engine-manager.js", "events-manager.js", "events-manager-extra.js", "events-manager-more.js", "engine-modes.js", "press-data.js", "social-data.js", "engine-extra.js", "engine-market.js", "press-ctx.js", "draw.js", "shootout.js", "life.js", "mgr-plus.js", "market26.js", "pets.js", "pet-items.js", "pet-sim.js", "achieve.js", "ach36.js", "week29.js", "club30.js", "nat31.js", "chal32.js", "story33.js", "edit35.js", "squad37.js", "match41.js", "world45.js", "dyn46.js", "blp47.js", "fam48.js", "goat.js", "crest.js", "faces.js", "pixel.js", "anim.js", "minigame.js",  "bolas.js", "pitch.js", "pitch3d-assets.js", "pitch3d.js", "vox-core.js", "sp-data.js", "sp-phys.js", "sp-ai.js", "sp-rig.js", "sp-3d.js", "sp-modes.js", "sp-play.js", "pet-style.js", "pet-models.js", "pet-props.js", "pet-audio.js", "ui.js", "ui-goat.js", "ui-press.js", "ui-draw.js", "ui-shootout.js", "ui-life.js", "ui-pets.js", "ui-sp.js", "rig.js", "view3d.js", "pet-rig.js", "pet-world.js", "ui-mgrplus.js", "ui-guide.js", "ui-steps.js", "ui-cups.js", "ui-week.js", "ui-club30.js", "ui-chal32.js", "ui-story33.js", "ui-35.js", "ui-37.js", "ui-41.js", "ui-45.js", "ui-46.js", "ui-47.js", "ui-48.js", "wide42.js", "ui-boot.js"]
web_config_path = ROOT / "web" / "config.json"
web_config = json.loads(web_config_path.read_text(encoding="utf-8-sig")) if web_config_path.exists() else {}
goat_api_url = os.environ.get("CAMINO_GOAT_API_URL", web_config.get("goat_api_url", "")).strip().rstrip("/")
if goat_api_url:
    parsed_goat_api_url = urlparse(goat_api_url)
    if (parsed_goat_api_url.scheme != "https" or
            not re.fullmatch(r"[A-Za-z0-9.-]+(?::[0-9]{1,5})?", parsed_goat_api_url.netloc) or
            parsed_goat_api_url.path or parsed_goat_api_url.query or parsed_goat_api_url.fragment):
        raise ValueError("CAMINO_GOAT_API_URL must be an HTTPS origin without a path")

# GLB de runtime. Se incrustan para que dist/index.html siga siendo un único
# fichero y funcione desde file:// y dentro de la APK, sin fetch ni CORS.
ASSET_FILES = {
    "male_lod1": "assets/players/male/male_lod1.glb",
    "male_lod2": "assets/players/male/male_lod2.glb",
    "female_lod1": "assets/players/female/female_lod1.glb",
    "female_lod2": "assets/players/female/female_lod2.glb",
    "goalkeeper_lod1": "assets/players/goalkeeper/goalkeeper_lod1.glb",
    "goalkeeper_lod2": "assets/players/goalkeeper/goalkeeper_lod2.glb",
    "ball_lod1": "assets/ball/ball_lod1.glb",
    "goal_lod1": "assets/stadium/goal_lod1.glb",
    "corner_flag_lod0": "assets/stadium/corner_flag_lod0.glb",
    "ad_board_lod0": "assets/stadium/ad_board_lod0.glb",
    "bench_lod0": "assets/stadium/bench_lod0.glb",
    "barrier_lod0": "assets/stadium/barrier_lod0.glb",
}
asset_pack = {}
for asset_id, rel in ASSET_FILES.items():
    asset_path = ROOT / rel
    if asset_path.exists():
        asset_pack[asset_id] = base64.b64encode(asset_path.read_bytes()).decode("ascii")
asset_js = "var P3D_ASSET_PACK = " + json.dumps(asset_pack, separators=(",", ":")) + ";\n"
if not asset_pack:
    print("Pitch3D: sin GLB de runtime; se usará el fallback procedural")

js = asset_js + "var GOAT_WEB_BUILD = false;\n" + "\n".join((SRC / n).read_text() for n in ORDER if (SRC / n).exists())
# etiqueta de versión: nombre y código de la app Android y la fecha de compilación
import re as _re, datetime as _dt
_man = (ROOT / "android" / "AndroidManifest.xml").read_text() if (ROOT / "android" / "AndroidManifest.xml").exists() else ""
_vn = (_re.search(r'versionName="([^"]+)"', _man) or [None, "?"])[1]
_vc = (_re.search(r'versionCode="(\d+)"', _man) or [None, "0"])[1]
js = 'var BUILD = {v: "%s", code: %s, t: "%s"};\n' % (_vn, _vc, _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")) + js
js = "var GOAT_API_URL = " + json.dumps(goat_api_url) + ";\n" + js
js = js.replace("</script", "<\\/script")
connect_src = goat_api_url if goat_api_url else "'none'"

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
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src {connect_src}; form-action 'none'; base-uri 'none'">
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
