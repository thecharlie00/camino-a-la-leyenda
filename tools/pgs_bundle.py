"""Prepara los logros para Google Play Juegos (Play Console → Servicios de juego de Play → Logros → Importar).

Lee la exportación de tools/pgs-export.cjs y escribe en store/play-games/:
  - logros.json: lista maestra (clave del juego, nombre único, puntos, orden, icono). La usa tools/pgs_map.py.
  - play-games-logros-N.zip: paquetes de importación (CSV sin cabecera + iconos 512x512, sin carpetas, < 203 archivos).
Idioma por defecto del juego en Play Console: español (es-ES). Traducciones: en-US, de-DE, it-IT, fr-FR.
Uso: python3 tools/pgs_bundle.py <exportación> [salida]"""
import csv, io, json, sys, zipfile
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "build/pgs-export")
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "store/play-games")
LOCALES = {"en": "en-US", "de": "de-DE", "it": "it-IT", "fr": "fr-FR"}
POINTS = {"b": 5, "s": 5, "g": 10, "p": 50}
SUFFIX = {"m": {"es": "míster", "en": "manager", "de": "Trainer", "it": "allenatore", "fr": "entraîneur"},
          "p": {"es": "jugador", "en": "player", "de": "Spieler", "it": "giocatore", "fr": "joueur"},
          "e": {"es": "Épocas", "en": "Eras", "de": "Epochen", "it": "Epoche", "fr": "Époques"}}
MAX_FILES = 199


def clean(text, limit):
    """Play Console no admite comas en nombres ni descripciones."""
    t = " ".join(str(text or "").replace(",", " ·").replace("\n", " ").split())
    return t[:limit].strip()


def small_png(path):
    """Icono 512x512 en PNG de paleta (mucho más ligero, mismo aspecto)."""
    from PIL import Image
    im = Image.open(path).convert("RGB").resize((512, 512)).quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def main():
    rows = json.loads((SRC / "achievements.json").read_text(encoding="utf-8"))
    for r in rows:
        r["group"] = "e" if r.get("era") else ("m" if r["mode"] == "m" else "p")
    # nombres únicos por idioma: si dos logros se llaman igual, se distinguen por recorrido
    for lang in ["es"] + list(LOCALES):
        seen = {}
        for r in rows:
            seen.setdefault(clean(r[lang][0], 100).lower(), []).append(r)
        for name, group in seen.items():
            if len(group) > 1:
                for r in group:
                    r[lang] = [clean(r[lang][0], 80) + " (" + SUFFIX[r["group"]][lang] + ")", r[lang][1]]
        # si aún coinciden (mismo recorrido), se numeran: «Mil batallas», «Mil batallas II»
        again = {}
        for r in rows:
            again.setdefault(clean(r[lang][0], 100).lower(), []).append(r)
        for group in again.values():
            for k, r in enumerate(group[1:], 2):
                r[lang] = [clean(r[lang][0], 90) + " " + ["", "", "II", "III", "IV", "V"][min(k, 5)], r[lang][1]]
        names = [clean(r[lang][0], 100).lower() for r in rows]
        dup = {n for n in names if names.count(n) > 1}
        if dup:
            raise SystemExit(f"Nombres repetidos en {lang}: {sorted(dup)}")
    total = sum(POINTS[r["rar"]] for r in rows)
    if total > 2000:
        raise SystemExit(f"Los puntos suman {total}; Play Games admite 2000 como máximo")
    master = []
    for i, r in enumerate(rows, 1):
        master.append({"key": r["id"], "name": clean(r["es"][0], 100), "description": clean(r["es"][1], 500), "points": POINTS[r["rar"]],
                       "rarity": r["rar"], "hidden": r["hide"], "order": i, "icon": r["icon"], "group": r["group"],
                       "translations": {LOCALES[l]: [clean(r[l][0], 100), clean(r[l][1], 500)] for l in LOCALES}})
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("play-games-logros-*.zip"):
        old.unlink()
    (OUT / "logros.json").write_text(json.dumps({"total_points": total, "achievements": master}, ensure_ascii=False, indent=1), encoding="utf-8")
    # paquetes: se reparten los logros para que cada zip tenga como mucho 199 archivos
    packs, cur, icons = [], [], set()
    for a in master:
        extra = 0 if a["icon"] in icons else 1
        if cur and len(icons) + extra + 3 > MAX_FILES:
            packs.append(cur); cur, icons = [], set()
        cur.append(a); icons.add(a["icon"])
    if cur:
        packs.append(cur)
    for n, pack in enumerate(packs, 1):
        def table(rows_):
            buf = io.StringIO(); w = csv.writer(buf, lineterminator="\n")
            for row in rows_:
                w.writerow(row)
            return buf.getvalue().encode("utf-8")
        meta = table([[a["name"], a["description"], "False", "", "Hidden" if a["hidden"] else "Revealed", a["points"], a["order"]] for a in pack])
        loc = table([[a["name"], t[0], t[1], code] for a in pack for code, t in a["translations"].items() if t[0] and (t[0] != a["name"] or t[1] != a["description"])])
        icm = table([[a["name"], a["icon"]] for a in pack])
        with zipfile.ZipFile(OUT / f"play-games-logros-{n}.zip", "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("AchievementsMetadata.csv", meta)
            z.writestr("AchievementsLocalizations.csv", loc)
            z.writestr("AchievementsIconMappings.csv", icm)
            for icon in sorted({a["icon"] for a in pack}):
                z.writestr(icon, small_png(SRC / "icons" / icon))
        print(f"play-games-logros-{n}.zip: {len(pack)} logros, {len({a['icon'] for a in pack})} iconos")
    print(f"{len(master)} logros, {total} puntos")


if __name__ == "__main__":
    main()
