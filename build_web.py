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

cfg = json.loads(pathlib.Path(os.environ.get("CAMINO_WEB_CONFIG") or (WEB / "config.json")).read_text(encoding="utf-8-sig"))
goat_api_url = os.environ.get("CAMINO_GOAT_API_URL", cfg.get("goat_api_url", "")).strip().rstrip("/")
client = (cfg.get("adsense_client") or "").strip()
if client and not re.fullmatch(r"ca-pub-\d{10,20}", client):
    raise SystemExit("adsense_client debe tener la forma ca-pub-1234567890123456")
slots = {k: (v or "").strip() for k, v in (cfg.get("slots") or {}).items()}
domain = (cfg.get("domain") or "").strip().lower()
base = ("https://" + domain + "/") if domain else (cfg.get("base_url") or "./")
repo_url = cfg.get("repo_url") or "#"

game = DIST / "index.html"
if not game.exists():
    raise SystemExit("Falta dist/index.html: ejecuta antes python3 build.py")

if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "jugar").mkdir(parents=True)
(OUT / "fonts").mkdir()

# --- juego: sin el SDK de Android y con la política de privacidad de la web con AdSense ---
html = game.read_text()
for a, b in (("var GOAT_WEB_BUILD = false;", "var GOAT_WEB_BUILD = true;"),
              ("var WEB_BUILD = false;", "var WEB_BUILD = true;"),
              ("var NO_ADS = false;", "var NO_ADS = true;"),
              ("var WEB_ADS = false;", "var WEB_ADS = true;" if client else "var WEB_ADS = false;")):
    assert html.count(a) == 1, "falta la marca " + a
    html = html.replace(a, b)
(OUT / "jugar" / "juego.html").write_text(html)

# --- tipografías del juego, servidas como archivos ---
faces = [("Big Shoulders Display", "big-shoulders-display", 800), ("Big Shoulders Display", "big-shoulders-display", 900),
         ("Archivo", "archivo", 400), ("Archivo", "archivo", 700), ("Archivo", "archivo", 800), ("Doto", "doto", 900),
         ("Pixelify Sans", "pixelify-sans", 500), ("Pixelify Sans", "pixelify-sans", 700), ("Silkscreen", "silkscreen", 400)]
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
shutil.copy(WEB / "goat-ladder.js", OUT / "goat-ladder.js")
shutil.copy(ROOT / "src" / "pixel.js", OUT / "pixel.js")
shutil.copy(ROOT / "src" / "trophies.js", OUT / "trophies.js")
shutil.copytree(WEB / "img", OUT / "img")

# --- plantillas, una por idioma: castellano en la raíz y /en/, /de/, /it/, /fr/ ---
TR = json.loads((WEB / "i18n.json").read_text())
LANGS = ["es", "en", "de", "it", "fr"]
LOCALE = {"es": "es_ES", "en": "en_GB", "de": "de_DE", "it": "it_IT", "fr": "fr_FR"}
PAGES = [("index.html", ""), ("jugar.html", "jugar/"), ("goat-ladder.html", "goat-ladder/"), ("privacidad.html", "privacidad/")]
today = datetime.date.today()

def t(l, k, **kw):
    v = TR[k][l]
    for a, b in kw.items():
        v = v.replace("{" + a + "}", str(b))
    return v

def ad(l, name):
    sid = slots.get(name, "")
    if not client or not sid:
        return ""
    lab = t(l, "ad_label")
    if name == "juego_movil":
        return (f'<div class="pmob"><p class="adlab">{lab}</p><ins class="adsbygoogle" style="display:inline-block;width:320px;height:50px" '
                f'data-ad-client="{client}" data-ad-slot="{sid}"></ins></div>')
    if name == "juego_lateral":
        return (f'<aside class="rail" aria-label="{lab}"><p class="adlab">{lab}</p><ins class="adsbygoogle" style="display:inline-block;width:300px;height:600px" '
                f'data-ad-client="{client}" data-ad-slot="{sid}"></ins></aside>')
    return (f'<aside class="adbox" aria-label="{lab}"><div class="wrap"><p class="adlab">{lab}</p><ins class="adsbygoogle" style="display:block" '
            f'data-ad-client="{client}" data-ad-slot="{sid}" data-ad-format="auto" data-full-width-responsive="true"></ins></div></aside>')

def head(R):
    s = ('<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
         '<meta name="theme-color" content="#0b1417">\n'
         f'<link rel="icon" type="image/png" href="{R}img/favicon.png">\n<link rel="apple-touch-icon" href="{R}img/apple-touch-icon.png">\n'
         f'<link rel="manifest" href="{R}manifest.webmanifest">\n'
         f'<link rel="preload" href="{R}fonts/big-shoulders-display-latin-900-normal.woff2" as="font" type="font/woff2" crossorigin>\n'
         f'<link rel="stylesheet" href="{R}site.css">')
    if client:
        s += (f'\n<meta name="google-adsense-account" content="{client}">'
              f'\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={client}" crossorigin="anonymous"></script>')
    return s

ver = re.search(r'var BUILD = \{v: "([^"]+)"', html)
def foot(l, L, R, page):
    consent = f'<button type="button" class="linkbtn" data-consent>{t(l, "consent")}</button>' if client else ""
    langs = "".join(f'<a href="{R}{"" if o == "es" else o + "/"}{page}" hreflang="{o}" lang="{o}" data-weblang="{o}"{" aria-current=\"page\"" if o == l else ""}>{TR["lang_name"][o]}</a>' for o in LANGS)
    return ('<footer class="foot"><div class="wrap">'
            f'<a href="{L}jugar/">{t(l, "play")}</a><a href="{L}privacidad/">{t(l, "privacy_policy")}</a>{consent}'
            f'<span>{t(l, "version", v=ver.group(1) if ver else "")}</span>'
            f'<nav class="flangs" aria-label="{t(l, "language")}">{langs}</nav>'
            f'<p class="legal">{t(l, "legal")}</p></div></footer>')

def langmenu(l, R, page):
    items = "".join(f'<a href="{R}{"" if o == "es" else o + "/"}{page}" hreflang="{o}" lang="{o}" data-weblang="{o}"{" aria-current=\"page\"" if o == l else ""}>{TR["lang_name"][o]}</a>' for o in LANGS)
    return (f'<details class="lang"><summary aria-label="{t(l, "language")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">'
            f'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>{l.upper()}</summary>'
            f'<div class="langm">{items}</div></details>')

def link(href, text): return f'<a href="{href}" rel="noopener">{text}</a>'

def render(name, l, page):
    depth = (0 if l == "es" else 1) + (0 if page == "" else 1)
    R = "../" * depth
    L = "" if page == "" else "../"
    url = base + ("" if l == "es" else l + "/") + page
    alt = "\n".join(f'<link rel="alternate" hreflang="{o}" href="{base}{"" if o == "es" else o + "/"}{page}">' for o in LANGS) + f'\n<link rel="alternate" hreflang="x-default" href="{base}{page}">'
    def shot(m):
        k = m.group(1); f2 = f"shot-{l}-{k}.webp"
        return f2 if l != "es" and (WEB / "img" / f2).exists() else f"shot-{k}.webp"
    og = f"og-{l}.png" if l != "es" and (WEB / "img" / f"og-{l}.png").exists() else "og.png"
    jst = {k[3:]: TR[k][l] for k in TR if k.startswith("js_")}
    jst.update({"a": TR["team_a"][l], "b": TR["team_b"][l]})
    datefmt = today.strftime("%d/%m/%Y") if l != "en" else today.strftime("%d %B %Y")
    rep = {
        "{{HEAD}}": head(R), "{{FOOT}}": foot(l, L, R, page), "{{LANG}}": l, "{{LOCALE}}": LOCALE[l], "{{URL}}": url, "{{ALT}}": alt,
        "{{BASE}}": base, "{{R}}": R, "{{OG}}": og, "{{LANGMENU}}": langmenu(l, R, page),
        "{{CONSENT_LINK}}": f'<button type="button" class="linkbtn" data-consent>{t(l, "cookies")}</button>' if client else "",
        "{{JS_T}}": "<script>window.T = " + json.dumps(jst, ensure_ascii=False) + ";</script>",
        "{{UPDATED}}": t(l, "updated", d=datefmt),
        "{{GOAT_API_URL}}": json.dumps(goat_api_url),
        "{{GOAT_URL}}": base + ("" if l == "es" else l + "/") + "goat-ladder/",
        "{{ADS_L3}}": t(l, "p_ads_l3", a=link("https://myadcenter.google.com/", "myadcenter.google.com"), b=link("https://www.aboutads.info/choices/", "aboutads.info")),
        "{{CONS}}": t(l, "p_cons", how=t(l, "cons_how_ads" if client else "cons_how_noads")),
        "{{HOST}}": t(l, "p_host", a=link("https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement", t(l, "p_host_a"))),
        "{{CHG}}": t(l, "p_chg", a=link(repo_url, t(l, "p_chg_a"))),
    }
    s2 = (WEB / name).read_text()
    for a, b in rep.items():
        s2 = s2.replace(a, b)
    s2 = re.sub(r"\{\{SHOT:(\w+)\}\}", shot, s2)
    s2 = re.sub(r"\{\{t:(\w+)\}\}", lambda m: t(l, m.group(1)), s2)
    s2 = re.sub(r"\{\{AD:(\w+)\}\}", lambda m: ad(l, m.group(1)), s2)
    assert "{{" not in s2, f"{l}/{name}: queda una marca sin sustituir: " + s2[s2.index("{{"):s2.index("{{") + 40]
    return s2

for l in LANGS:
    for name, page in PAGES:
        d = OUT / ("" if l == "es" else l) / page
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(render(name, l, page))
(OUT / "404.html").write_text(render("index.html", "es", "").replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="canonical"'))
# en una ruta desconocida las rutas relativas no valen: el 404 usa la base absoluta
if base.startswith("http"):
    t404 = (OUT / "404.html").read_text()
    t404 = re.sub(r'(href|src)="(?!https?:|#|data:)([^"]*)"', lambda m: f'{m.group(1)}="{base}{m.group(2).lstrip("./")}"' if not m.group(2).startswith("/") else m.group(0), t404)
    (OUT / "404.html").write_text(t404)

(OUT / "manifest.webmanifest").write_text(json.dumps({
    "name": "Camino a la Leyenda", "short_name": "Camino", "start_url": "./jugar/", "display": "standalone",
    "background_color": "#0b1417", "theme_color": "#0b1417", "lang": "es",
    "icons": [{"src": "img/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "img/icon-512.png", "sizes": "512x512", "type": "image/png"}]}, ensure_ascii=False))
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base}sitemap.xml\n")
(OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    "".join(f"<url><loc>{base}{'' if l == 'es' else l + '/'}{p}</loc>" + "".join(f'<xhtml:link rel="alternate" hreflang="{o}" href="{base}{"" if o == "es" else o + "/"}{p}"/>' for o in LANGS) + "</url>\n"
            for l in LANGS for _, p in PAGES) + "</urlset>\n")
if client:
    (OUT / "ads.txt").write_text(f"google.com, {client.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n")
if domain:
    (OUT / "CNAME").write_text(domain + "\n")
(OUT / ".nojekyll").write_text("")
n = sum(1 for _ in OUT.rglob("*") if _.is_file())
print(f"web: {n} archivos en {OUT} · anuncios {'activados (' + client + ')' if client else 'desactivados (falta adsense_client)'} · base {base}")
