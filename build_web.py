#!/usr/bin/env python3
"""Genera la web pública (GitHub Pages) en dist/site a partir de web/ y del juego compilado (dist/index.html).

Uso: python3 build.py && python3 build_web.py

- web/config.json: ID de editor de AdSense, IDs de los bloques de anuncios, dominio propio y enlaces.
  Sin ID de AdSense la web funciona igual, sin anuncios (los huecos no se pintan).
- El juego va dentro de jugar/juego.html, sin conexiones a internet (su propia CSP lo impide);
  los anuncios solo están en la página que lo rodea, nunca dentro de la partida.
"""
import datetime, json, os, pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent
WEB = ROOT / "web"
DIST = pathlib.Path(os.environ["CAMINO_DIST"]) if os.environ.get("CAMINO_DIST") else ROOT / "dist"
OUT = DIST / "site"
FONTS = ROOT / "fonts" / "node_modules" / "@fontsource"

cfg = json.loads(pathlib.Path(os.environ.get("CAMINO_WEB_CONFIG") or (WEB / "config.json")).read_text())
client = (cfg.get("adsense_client") or "").strip()
if client and not re.fullmatch(r"ca-pub-\d{10,20}", client):
    raise SystemExit("adsense_client debe tener la forma ca-pub-1234567890123456")
slots = {k: (v or "").strip() for k, v in (cfg.get("slots") or {}).items()}
domain = (cfg.get("domain") or "").strip().lower()
base = ("https://" + domain + "/") if domain else (cfg.get("base_url") or "./")
play_url = cfg.get("play_url") or "#"

game = DIST / "index.html"
if not game.exists():
    raise SystemExit("Falta dist/index.html: ejecuta antes python3 build.py")

if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "jugar").mkdir(parents=True)
(OUT / "privacidad").mkdir()
(OUT / "fonts").mkdir()

# --- juego: sin el SDK de Android y con la política de privacidad de la web con AdSense ---
html = game.read_text()
for a, b in (("var WEB_BUILD = false;", "var WEB_BUILD = true;"), ("var NO_ADS = false;", "var NO_ADS = true;"), ("var WEB_ADS = false;", "var WEB_ADS = true;" if client else "var WEB_ADS = false;")):
    assert html.count(a) == 1, "falta la marca " + a
    html = html.replace(a, b)
(OUT / "jugar" / "juego.html").write_text(html)

# --- tipografías del juego, servidas como archivos ---
faces = [("Big Shoulders Display", "big-shoulders-display", 800), ("Big Shoulders Display", "big-shoulders-display", 900),
         ("Archivo", "archivo", 400), ("Archivo", "archivo", 700), ("Archivo", "archivo", 800), ("Doto", "doto", 900)]
css = []
for fam, pkg, w in faces:
    for sub in ("latin", "latin-ext"):
        src = FONTS / pkg / "files" / f"{pkg}-{sub}-{w}-normal.woff2"
        if not src.exists():
            continue
        shutil.copy(src, OUT / "fonts" / src.name)
        rng = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212" if sub == "latin" else "U+0100-024F,U+1E00-1EFF,U+20A0-20C0"
        css.append(f'@font-face{{font-family:"{fam}";font-weight:{w};font-style:normal;font-display:swap;src:url(fonts/{src.name}) format("woff2");unicode-range:{rng}}}')
(OUT / "site.css").write_text("\n".join(css) + "\n" + (WEB / "site.css").read_text())
shutil.copy(WEB / "site.js", OUT / "site.js")
shutil.copytree(WEB / "img", OUT / "img")

# --- plantillas ---
def ad(name, slot_key=None):
    sid = slots.get(slot_key or name, "")
    if not client or not sid:
        return ""
    if name == "juego_movil":
        return ('<div class="pmob"><p class="adlab">Publicidad</p><ins class="adsbygoogle" style="display:inline-block;width:320px;height:50px" '
                f'data-ad-client="{client}" data-ad-slot="{sid}"></ins></div>')
    if name.startswith("juego_lateral"):
        return ('<aside class="rail" aria-label="Publicidad"><p class="adlab">Publicidad</p><ins class="adsbygoogle" style="display:inline-block;width:300px;height:600px" '
                f'data-ad-client="{client}" data-ad-slot="{sid}"></ins></aside>')
    return ('<aside class="adbox" aria-label="Publicidad"><div class="wrap"><p class="adlab">Publicidad</p><ins class="adsbygoogle" style="display:block" '
            f'data-ad-client="{client}" data-ad-slot="{sid}" data-ad-format="auto" data-full-width-responsive="true"></ins></div></aside>')

def head(pre):
    s = ('<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
         '<meta name="theme-color" content="#0b1417">\n'
         f'<link rel="icon" type="image/png" href="{pre}img/favicon.png">\n<link rel="apple-touch-icon" href="{pre}img/apple-touch-icon.png">\n'
         f'<link rel="manifest" href="{pre}manifest.webmanifest">\n'
         f'<link rel="preload" href="{pre}fonts/big-shoulders-display-latin-900-normal.woff2" as="font" type="font/woff2" crossorigin>\n'
         f'<link rel="stylesheet" href="{pre}site.css">')
    if client:
        s += (f'\n<meta name="google-adsense-account" content="{client}">'
              f'\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={client}" crossorigin="anonymous"></script>')
    return s

def foot(pre):
    consent = '<button type="button" class="linkbtn" data-consent>Privacidad y cookies</button>' if client else ""
    ver = re.search(r'var BUILD = \{v: "([^"]+)"', html)
    return ('<footer class="foot"><div class="wrap">'
            f'<a href="{pre}jugar/">Jugar</a><a href="{pre}privacidad/">Política de privacidad</a>{consent}'
            f'<a href="{play_url}" rel="noopener">App de Android</a>'
            f'<span>Versión {ver.group(1) if ver else ""}</span>'
            '<p class="legal">Camino a la Leyenda es un juego independiente. Los nombres de futbolistas, entrenadores y clubes son inventados; '
            'no está afiliado a ningún club, liga ni jugador.</p></div></footer>')

today = datetime.date.today().strftime("%d/%m/%Y")
def render(name, pre):
    t = (WEB / name).read_text()
    t = t.replace("{{HEAD}}", head(pre)).replace("{{FOOT}}", foot(pre)).replace("{{BASE}}", base).replace("{{PLAY_URL}}", play_url).replace("{{DATE}}", today)
    t = t.replace("{{CONSENT_LINK}}", '<button type="button" class="linkbtn" data-consent>Cookies</button>' if client else "")
    t = t.replace("{{CONSENT_TEXT}}", " con el enlace «Privacidad y cookies» del pie de cualquier página" if client else " borrando los datos de este sitio en tu navegador")
    t = re.sub(r"\{\{AD:(\w+)\}\}", lambda m: ad(m.group(1), "juego_lateral" if m.group(1) == "juego_lateral2" else None), t)
    assert "{{" not in t, name + ": queda una marca sin sustituir"
    return t

(OUT / "index.html").write_text(render("index.html", ""))
(OUT / "jugar" / "index.html").write_text(render("jugar.html", "../"))
(OUT / "privacidad" / "index.html").write_text(render("privacidad.html", "../"))
(OUT / "404.html").write_text(render("index.html", "").replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="canonical"'))
# en una ruta desconocida las rutas relativas no valen: el 404 usa la base absoluta
if base.startswith("http"):
    t = (OUT / "404.html").read_text()
    t = re.sub(r'(href|src)="(?!https?:|#|data:)([^"]*)"', lambda m: f'{m.group(1)}="{base}{m.group(2).lstrip("./")}"' if not m.group(2).startswith("/") else m.group(0), t)
    (OUT / "404.html").write_text(t)

(OUT / "manifest.webmanifest").write_text(json.dumps({
    "name": "Camino a la Leyenda", "short_name": "Camino", "start_url": "./jugar/", "display": "standalone",
    "background_color": "#0b1417", "theme_color": "#0b1417", "lang": "es",
    "icons": [{"src": "img/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "img/icon-512.png", "sizes": "512x512", "type": "image/png"}]}, ensure_ascii=False))
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base}sitemap.xml\n")
(OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "".join(f"<url><loc>{base}{p}</loc></url>\n" for p in ("", "jugar/", "privacidad/")) + "</urlset>\n")
if client:
    (OUT / "ads.txt").write_text(f"google.com, {client.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n")
if domain:
    (OUT / "CNAME").write_text(domain + "\n")
(OUT / ".nojekyll").write_text("")
n = sum(1 for _ in OUT.rglob("*") if _.is_file())
print(f"web: {n} archivos en {OUT} · anuncios {'activados (' + client + ')' if client else 'desactivados (falta adsense_client)'} · base {base}")
