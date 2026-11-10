"""Vincula los logros del juego con los de Google Play Juegos.

Después de importar los logros en Play Console, descarga los recursos (Logros → «Obtener recursos» → Android)
y guárdalos como archivo XML. Este script empareja cada logro del juego (por su nombre en español, el idioma
por defecto) con su ID de Play y escribe:
  - android/res/raw/pgs_achievements.json  {clave del juego: ID de Play}
  - android/res/values/pgs.xml             ID del proyecto de Play Games (activa la integración)
Uso: python3 tools/pgs_map.py games-ids.xml"""
import difflib, json, re, sys, unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def norm(text):
    t = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "_", t).strip("_")


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    tree = ET.parse(sys.argv[1])
    res = {e.get("name"): (e.text or "").strip() for e in tree.getroot().iter("string")}
    project = res.get("game_services_project_id") or res.get("app_id") or ""
    if not re.fullmatch(r"\d{6,}", project):
        raise SystemExit("No encuentro el ID del proyecto (game_services_project_id o app_id) en el XML")
    play = {norm(k[len("achievement_"):]): v for k, v in res.items() if k.startswith("achievement_") and v}
    master = json.loads((ROOT / "store/play-games/logros.json").read_text(encoding="utf-8"))["achievements"]
    out, missing = {}, []
    for a in master:
        key = norm(a["name"])
        pid = play.get(key) or play.get(norm(a["name"].encode("ascii", "ignore").decode()))  # Play quita las letras con tilde
        if not pid:
            close = difflib.get_close_matches(key, play.keys(), n=1, cutoff=0.92)
            pid = play.get(close[0]) if close else None
        if pid:
            out[a["key"]] = pid
        else:
            missing.append(a["name"])
    if len(set(out.values())) != len(out):
        raise SystemExit("Dos logros del juego apuntan al mismo ID de Play; revisa los nombres")
    (ROOT / "android/res/raw/pgs_achievements.json").write_text(json.dumps(out, indent=0, sort_keys=True) + "\n", encoding="utf-8")
    (ROOT / "android/res/values/pgs.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        f'    <string name="game_services_project_id" translatable="false">{project}</string>\n</resources>\n', encoding="utf-8")
    print(f"{len(out)} de {len(master)} logros vinculados; proyecto {project}")
    if missing:
        print("Sin vincular (revisa que se importaron con este nombre):")
        for m in missing:
            print("  - " + m)
        sys.exit(1)


if __name__ == "__main__":
    main()
