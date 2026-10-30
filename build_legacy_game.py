#!/usr/bin/env python3
"""Empaqueta el juego en un único HTML (artifact) y en un documento completo para la APK."""
import base64, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent
import os
from urllib.parse import urlparse
# Snapshot of the complete 5.7 game engine, including its 3D rigs, models, music and pet world.
GAME_ROOT = ROOT / "legacy-game"
SRC = GAME_ROOT / "src"
FONTS = GAME_ROOT / "fonts" / "files"
ASSET_ROOT = GAME_ROOT

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
        f = FONTS / f"{pkg}-{'latin' if sub == 'digits' else sub}-{w}-normal.woff2"
        data = base64.b64encode(f.read_bytes()).decode()
        css_fonts.append(
            f'@font-face{{font-family:"{fam}";font-style:normal;font-weight:{w};font-display:swap;'
            f'src:url(data:font/woff2;base64,{data}) format("woff2");unicode-range:{RANGES[sub]}}}'
        )

css = "\n".join(css_fonts) + "\n" + (SRC / "style.css").read_text(encoding="utf-8")
LANG_FILES = ["lang-en.js", "lang-de.js", "lang-it.js", "lang-fr.js", "lang-fem.js"]
LANG_DATA = {name: (SRC / name).read_text(encoding="utf-8") for name in LANG_FILES}
LANG_MARKUP = "\n".join(
    '<script type="text/plain" id="camino-i18n-' + ("fem" if name == "lang-fem.js" else name[5:7]) + '">' +
    source.replace("</script", "<" + chr(92) + "/script") + '</script>'
    for name, source in LANG_DATA.items()
)
ERAS_ROOT = GAME_ROOT / "erascene"
ERAS_PACKS = [json.loads(path.read_text(encoding="utf-8")) for path in sorted((ERAS_ROOT / "packs").glob("*.json"))]
ERAS_TIMELINE = json.loads((ERAS_ROOT / "rules-timeline.json").read_text(encoding="utf-8"))
ERAS_I18N = json.loads((ERAS_ROOT / "translations.json").read_text(encoding="utf-8"))
ERAS_DECISIONS = json.loads((ERAS_ROOT / "decisions.json").read_text(encoding="utf-8"))
EXPECTED_ERAS = ["1970s", "1980s", "1990s", "2000s", "2010s", "2020s"]
if [pack.get("id") for pack in ERAS_PACKS] != EXPECTED_ERAS:
    raise ValueError("Era packs must cover 1970s through 2020s exactly once")
available_clubs = {name for clubs in re.findall(r'clubs:\"([^\"]+)\"', (SRC / "data.js").read_text(encoding="utf-8")) for name in clubs.split("|")}
for pack in ERAS_PACKS:
    years = pack.get("years", [])
    if pack.get("schema") != 1 or len(years) != 2 or years[1] - years[0] != 9:
        raise ValueError(f"Invalid year range or schema in era pack {pack.get('id')}")
    for section in ("rules", "media", "economy", "presentation", "staff", "playerModel", "referenceClubs"):
        if section not in pack:
            raise ValueError(f"Era pack {pack['id']} is missing {section}")
    missing_clubs = [name for name in pack["referenceClubs"] if name not in available_clubs]
    if missing_clubs:
        raise ValueError(f"Era pack {pack['id']} has clubs absent from the shared world: {missing_clubs}")
if ERAS_DECISIONS.get("schema") != 2 or len(ERAS_DECISIONS.get("topics", [])) != 10:
    raise ValueError("Era decision catalogue schema 2 must define ten topics")
if set(ERAS_DECISIONS.get("contexts", {})) != set(EXPECTED_ERAS) or any(len(items) != 10 for items in ERAS_DECISIONS.get("contexts", {}).values()):
    raise ValueError("Era decision catalogue must define ten period-specific situations for every decade")
if set(ERAS_DECISIONS.get("periods", {})) != set(EXPECTED_ERAS):
    raise ValueError("Era decision catalogue must define a frame for all six decades")
expected_records = {"1970s": 170, "1980s": 170, "1990s": 170, "2000s": 170, "2010s": 160, "2020s": 160}
history_events = ERAS_DECISIONS.get("historyEvents", [])
events_by_id = {event.get("id"): event for event in history_events}
if len(history_events) != 40 or len(events_by_id) != 40:
    raise ValueError("Era decision catalogue must define 40 unique historical anchors")
for event in history_events:
    year = event.get("year")
    if not event.get("id") or event.get("decade") not in EXPECTED_ERAS or not isinstance(year, int) or year // 10 * 10 != int(event["decade"][:4]):
        raise ValueError(f"Invalid historical decision anchor: {event.get('id')}")
    for field in ("label", "fact"):
        if set(event.get(field, {})) != {"es", "en", "de", "it", "fr"} or any(not event[field].get(language) for language in ("es", "en", "de", "it", "fr")):
            raise ValueError(f"Historical anchor {event['id']} is missing localized {field} text")
seen_decisions = set()
for decade in EXPECTED_ERAS:
    records = [record for record in ERAS_DECISIONS.get("records", []) if record.get("decade") == decade]
    base_records = [record for record in records if not record.get("historyEventId")]
    if len(records) != expected_records[decade] or len(base_records) != 100:
        raise ValueError(f"Era decision catalogue must contain 100 base decisions plus historical decisions for {decade}")
    base_pairs = {(record.get("topic"), record.get("context")) for record in base_records}
    if len(base_pairs) != 100:
        raise ValueError(f"Era decision catalogue must preserve 100 distinct original topic/situation combinations for {decade}")
    for record in records:
        if not record.get("id") or record["id"] in seen_decisions:
            raise ValueError(f"Era decision id is missing or duplicated: {record.get('id')}")
        seen_decisions.add(record["id"])
        if not (0 <= record.get("topic", -1) < len(ERAS_DECISIONS["topics"])) or not (0 <= record.get("context", -1) < len(ERAS_DECISIONS["contexts"][decade])):
            raise ValueError(f"Era decision {record['id']} references an unknown topic or situation")
        if record.get("intensity") not in (1, 2, 3):
            raise ValueError(f"Era decision {record['id']} has invalid intensity")
        if record.get("historyEventId"):
            event = events_by_id.get(record["historyEventId"])
            if not event or event["decade"] != decade:
                raise ValueError(f"Historical decision {record['id']} points to an event from another decade")
historical_records = [record for record in ERAS_DECISIONS["records"] if record.get("historyEventId")]
if len(ERAS_DECISIONS["records"]) != 1000 or len(historical_records) != 400:
    raise ValueError("Era decision catalogue must contain exactly 600 original and 400 historical decisions")
for event in history_events:
    linked = [record for record in historical_records if record["historyEventId"] == event["id"]]
    if len(linked) != 10 or {record["topic"] for record in linked} != set(range(10)):
        raise ValueError(f"Historical anchor {event['id']} must have one decision for each of the ten topics")
for phrase in [phrase for items in ERAS_DECISIONS["contexts"].values() for phrase in items] + [topic["key"] for topic in ERAS_DECISIONS["topics"]] + list(ERAS_DECISIONS["periods"].values()) + ["Marco histórico ({year}): {fact}", "El hecho histórico sirve solo de contexto; el dilema y sus efectos son ficticios y no se atribuyen a clubes o personas reales. Elige según los efectos mostrados."]:
    if phrase not in ERAS_I18N:
        raise ValueError(f"Era decision phrase is missing from translations: {phrase}")
for key, locales in ERAS_I18N.items():
    for language in ("en", "de", "it", "fr"):
        if not locales.get(language):
            raise ValueError(f"Era translation {key!r} is missing {language}")
        source_tokens = sorted(re.findall(r"\{[A-Za-z_]+\}", key))
        translated_tokens = sorted(re.findall(r"\{[A-Za-z_]+\}", locales[language]))
        if source_tokens != translated_tokens:
            raise ValueError(f"Era translation placeholders do not match for {key!r} ({language})")
ERA_RULE_KEYS = {"winPoints", "backPassBanned", "transferWindows", "maxSubs", "var", "goldenGoal", "silverGoal", "goalLineTech",
                 "offsideLevelOnside", "goalkeeperSub", "awayGoals", "tackleFromBehindRed", "fixedShirtNumbers", "goalkeeperSeconds", "foreignLimit"}
if ERAS_TIMELINE.get("schema") != 2 or any("year" not in event or "changes" not in event for event in ERAS_TIMELINE.get("events", [])):
    raise ValueError("Era rules timeline is invalid (schema 2: year, scope, changes)")
_ids = set()
for event in ERAS_TIMELINE["events"]:
    scope = event.get("scope") or {}
    kind = scope.get("type")
    if event.get("id") in _ids:
        raise ValueError(f"Duplicate era timeline event {event.get('id')}")
    _ids.add(event.get("id"))
    if kind not in ("global", "league", "competition", "confederation"):
        raise ValueError(f"Era timeline event {event.get('id')} has an invalid scope")
    lists = {"league": "leagues", "competition": "competitions", "confederation": "confederations"}
    if kind != "global" and not (isinstance(scope.get(lists[kind]), list) and scope[lists[kind]]):
        raise ValueError(f"Era timeline event {event.get('id')} needs a non-empty {lists[kind]} list")
    if kind == "league" and any(not re.fullmatch(r"[A-Z]{3}[0-9]*", code) for code in scope["leagues"]):
        raise ValueError(f"Era timeline event {event.get('id')} uses an unknown league code")
    if "until" in event and (not isinstance(event["until"], int) or event["until"] < event["year"]):
        raise ValueError(f"Era timeline event {event.get('id')} has an invalid until year")
    if "rules" in event["changes"] and not event.get("source"):
        raise ValueError(f"Era rule change {event.get('id')} must cite a source")
for pack in ERAS_PACKS:
    missing_rules = ERA_RULE_KEYS - set(pack["rules"])
    if missing_rules:
        raise ValueError(f"Era pack {pack['id']} is missing rules {sorted(missing_rules)}")
    if "varByCompetition" in pack["rules"]:
        raise ValueError(f"Era pack {pack['id']} still uses varByCompetition; VAR is scoped in the timeline")
    if re.search(r"umbro|adidas|nike|puma|mitre|select", json.dumps(pack["presentation"]).lower()):
        raise ValueError(f"Era pack {pack['id']} names a brand in its presentation")
if [event["year"] for event in ERAS_TIMELINE["events"]] != sorted(event["year"] for event in ERAS_TIMELINE["events"]):
    raise ValueError("Era rules timeline events must be chronological")
ERAS_CLUBS = json.loads((ERAS_ROOT / "clubs-history.json").read_text(encoding="utf-8"))
ERAS_COMPS = json.loads((ERAS_ROOT / "competitions.json").read_text(encoding="utf-8"))
ERAS_HISTORY = json.loads((ERAS_ROOT / "history.json").read_text(encoding="utf-8"))
if ERAS_HISTORY.get("schema") != 1 or not ERAS_HISTORY.get("seasons"):
    raise ValueError("Era history must use schema 1 and list real champions by season")
for season, winners in ERAS_HISTORY["seasons"].items():
    if not season.isdigit() or not 1950 <= int(season) <= 2030:
        raise ValueError(f"Era history season {season} is invalid")
    for key in winners:
        if key not in ("UCL", "UEL", "UCWC", "LIB", "ICC") and not re.fullmatch(r"L:[A-Z]{3}[0-9]*", key):
            raise ValueError(f"Era history uses an unknown competition key {key}")
        if not ERAS_HISTORY["sources"].get(key):
            raise ValueError(f"Era history {key} needs a source")
if ERAS_COMPS.get("schema") != 1:
    raise ValueError("Era competitions must use schema 1")
for comp in ERAS_COMPS["club"]:
    years, names, formats = comp.get("years"), comp.get("names", []), comp.get("formats", [])
    if not comp.get("key") or not isinstance(years, list) or len(years) != 2 or not names or not formats:
        raise ValueError(f"Era competition {comp.get('key')} needs key, years, names and formats")
    if names[0][0] > years[0] or [n[0] for n in names] != sorted(n[0] for n in names):
        raise ValueError(f"Era competition {comp['key']} names must be chronological and cover its first year")
    if [f["from"] for f in formats] != sorted(f["from"] for f in formats) or formats[0]["from"] > years[0]:
        raise ValueError(f"Era competition {comp['key']} formats must be chronological and cover its first year")
    for f in formats:
        if f["type"] in ("ko", "groups") and not (isinstance(f.get("size"), int) and f["size"] >= 4 and (f["size"] & (f["size"] - 1)) == 0 or f["type"] == "groups"):
            raise ValueError(f"Era competition {comp['key']} knockout size must be a power of two")
        if f["type"] == "groups" and f["size"] % f["groups"]:
            raise ValueError(f"Era competition {comp['key']} groups must divide its size")
for comp in ERAS_COMPS["national"]:
    years = [e["y"] for e in comp.get("editions", [])]
    if not years or years != sorted(years) or len(set(years)) != len(years):
        raise ValueError(f"Era national tournament {comp.get('key')} editions must be unique and chronological")
    for e in comp["editions"]:
        if e.get("groups") and e["size"] % e["groups"]:
            raise ValueError(f"Era national tournament {comp['key']} {e['y']}: groups must divide the size")
_world_sources = "".join(path.read_text(encoding="utf-8") for path in sorted(SRC.glob("data*.js")))
_league_ids = set(re.findall(r'id:\s*"([A-Z]{2,4}[0-9]*)"', _world_sources))
_world_clubs = {name for chunk in re.findall(r'"([^"\n]*\|[^"\n]*)"', _world_sources) for name in chunk.split("|")}
if ERAS_CLUBS.get("schema") != 1:
    raise ValueError("Era club history must use schema 1")
for name, entry in ERAS_CLUBS["clubs"].items():
    if name not in _world_clubs:
        raise ValueError(f"Era club history names a club absent from the world: {name}")
    if not isinstance(entry.get("founded"), int) or not entry.get("src"):
        raise ValueError(f"Era club history entry {name} needs a founding year and a source")
    names = entry.get("names", [])
    if [n[0] for n in names] != sorted(n[0] for n in names) or (names and names[0][0] < entry["founded"]):
        raise ValueError(f"Era club history names for {name} must be chronological and not predate the club")
for league_id, entry in ERAS_CLUBS["leagues"].items():
    if _league_ids and league_id not in _league_ids:
        raise ValueError(f"Era club history names an unknown league: {league_id}")
    if not entry.get("src"):
        raise ValueError(f"Era league history {league_id} needs a source")
_decision_text = json.dumps(ERAS_DECISIONS, ensure_ascii=False)
for real_name in ("Paolo Rossi", "Michel Platini", "Diego Maradona", "David Trezeguet"):
    if real_name in _decision_text:
        raise ValueError(f"Era decisions must use versioned player names, not {real_name}")
ERAS_MOMENTS = json.loads((ERAS_ROOT / "moments.json").read_text(encoding="utf-8"))
_LANGS5 = {"es", "en", "de", "it", "fr"}
_SECONDARY = {"clean", "score2", "score3", "noET", "noDefend", "allPens", "firstFive", "bestShot", "save2", "save3", "concede1"}
if ERAS_MOMENTS.get("schema") != 1 or len(ERAS_MOMENTS.get("moments", [])) != 18:
    raise ValueError("Era moments must use schema 1 and define 18 legend moments")
_moment_ids = set()
for decade in EXPECTED_ERAS:
    if len([m for m in ERAS_MOMENTS["moments"] if m.get("decade") == decade]) != 3:
        raise ValueError(f"Era moments must define three legend moments for {decade}")
for m in ERAS_MOMENTS["moments"]:
    if m["id"] in _moment_ids or m["year"] // 10 * 10 != int(m["decade"][:4]) or m["kind"] not in ("match", "shootout", "gkshootout"):
        raise ValueError(f"Era moment {m['id']} is duplicated or has an invalid year or kind")
    _moment_ids.add(m["id"])
    for field in ("fact", "setup"):
        if set(m[field]) != _LANGS5 or not all(m[field].values()):
            raise ValueError(f"Era moment {m['id']} is missing localized {field}")
    if len(m.get("secondary", [])) != 3 or not set(m["secondary"]) <= _SECONDARY:
        raise ValueError(f"Era moment {m['id']} needs three known secondary objectives")
    for team in m["teams"]:
        if team["type"] == "club" and team["name"] not in _world_clubs:
            raise ValueError(f"Era moment {m['id']} names a club absent from the world: {team['name']}")
_cards = [c for p in ERAS_MOMENTS["album"]["pages"] for c in p["cards"]]
if len({c["id"] for c in _cards}) != len(_cards) or any(set(c["name"]) != _LANGS5 for c in _cards):
    raise ValueError("Era album cards must be unique and localized")
_reward_ids = {r["id"] for r in ERAS_MOMENTS["rewards"]}
for c in _cards:
    if c["kind"] == "moment" and c["ref"] not in _moment_ids:
        raise ValueError(f"Era album card {c['id']} points to an unknown moment")
    if c["kind"] == "club" and c["ref"] not in _world_clubs:
        raise ValueError(f"Era album card {c['id']} names a club absent from the world")
for page in ERAS_MOMENTS["album"]["pages"]:
    if page["reward"] not in _reward_ids:
        raise ValueError(f"Era album page {page['id']} has an unknown reward")
for r in ERAS_MOMENTS["rewards"]:
    if r["who"] not in ("p", "m") or set(r["names"]) != {"en", "de", "it", "fr"}:
        raise ValueError(f"Era reward {r['id']} needs an owner and four translations")
_j = lambda value: json.dumps(value, ensure_ascii=False, separators=(",", ":"))
# en Android cada parte es un módulo propio para que ninguna tarea de arranque sea demasiado grande
ERAS_PARTS = [
    "var ERAS_MODE = true;\nvar ERAS_DATA = " + _j({"packs": ERAS_PACKS, "timeline": ERAS_TIMELINE, "clubsHistory": ERAS_CLUBS, "competitions": ERAS_COMPS, "history": ERAS_HISTORY}) + ";\n",
    "ERAS_DATA.decisions = " + _j(ERAS_DECISIONS) + ";\n",
    "ERAS_DATA.moments = " + _j(ERAS_MOMENTS) + ";\n",
    "var ERAS_I18N = " + _j(ERAS_I18N) + ";\n",
]
ERAS_DATA_JS = "".join(ERAS_PARTS)
ORDER = ["i18n.js"] + LANG_FILES + ["data.js", "data-es.js", "data-f.js", "data-45.js", "data-48.js", "names.js", "real.js", "real-f.js", "engine-core.js", "engine-player.js", "events.js", "events-extra.js", "events-more.js", "trophies.js", "engine-manager.js", "events-manager.js", "events-manager-extra.js", "events-manager-more.js", "engine-modes.js", "press-data.js", "social-data.js", "engine-extra.js", "engine-market.js", "press-ctx.js", "draw.js", "shootout.js", "life.js", "mgr-plus.js", "market26.js", "pets.js", "pet-items.js", "pet-sim.js", "achieve.js", "ach36.js", "week29.js", "club30.js", "nat31.js", "chal32.js", "story33.js", "edit35.js", "squad37.js", "match41.js", "world45.js", "dyn46.js", "blp47.js", "fam48.js", "goat.js", "crest.js", "faces.js", "pixel.js", "anim.js", "minigame.js",  "bolas.js", "pitch.js", "pitch3d-assets.js", "pitch3d.js", "vox-core.js", "sp-data.js", "sp-phys.js", "sp-ai.js", "sp-rig.js", "sp-3d.js", "sp-modes.js", "sp-play.js", "save56.js", "gx-data.js", "gx-core.js", "gx-items.js", "gx-chal.js", "gx-events.js", "gx-mgr.js", "gx-mevents.js", "look56.js", "pet-style.js", "pet-models.js", "pet-props.js", "pet-audio.js", "ui.js", "ui-goat.js", "ui-press.js", "ui-draw.js", "ui-shootout.js", "ui-life.js", "ui-pets.js", "ui-sp.js", "rig.js", "view3d.js", "pet-rig.js", "pet-world.js", "ui-mgrplus.js", "ui-guide.js", "ui-steps.js", "ui-gx.js", "ui-gear.js", "ui-shop.js", "ui-gxev.js", "ui-mgryo.js", "ui-yo3d.js", "ui-scene3d.js", "ui-cups.js", "ui-week.js", "ui-club30.js", "ui-chal32.js", "ui-story33.js", "ui-35.js", "ui-37.js", "ui-41.js", "ui-45.js", "ui-46.js", "ui-47.js", "ui-48.js", "wide42.js", "eras-core.js", "eras-comps.js", "eras-moments.js", "ui-eras.js", "ui-eras-moments.js", "ui-boot.js"]
web_config_path = ROOT / "web" / "config.json"
web_config = json.loads(web_config_path.read_text(encoding="utf-8-sig")) if web_config_path.exists() else {}
# Keep the same public GOAT Ladder worker configured on the localized web pages.
DEFAULT_GOAT_API_URL = "https://camino-goat-ladder.httpscamino-goat-ladderworkersdev.workers.dev"
goat_api_url = os.environ.get("CAMINO_GOAT_API_URL", web_config.get("goat_api_url", DEFAULT_GOAT_API_URL)).strip().rstrip("/")
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
    asset_path = ASSET_ROOT / rel
    if asset_path.exists():
        asset_pack[asset_id] = base64.b64encode(asset_path.read_bytes()).decode("ascii")
asset_markup = '<template id="pitch3d-asset-pack">' + json.dumps(asset_pack, separators=(",", ":")) + '</template>'
if not asset_pack:
    print("Pitch3D: sin GLB de runtime; se usará el fallback procedural")

# Version metadata is shared; runtime packaging differs only by target.
import re as _re, datetime as _dt
_man = (ROOT / "android" / "AndroidManifest.xml").read_text(encoding="utf-8") if (ROOT / "android" / "AndroidManifest.xml").exists() else ""
_vn = (_re.search(r'versionName="([^"]+)"', _man) or [None, "?"])[1]
_vc = (_re.search(r'versionCode="(\d+)"', _man) or [None, "0"])[1]
build_js = 'var BUILD = {v: "%s", code: %s, t: "%s"};\n' % (_vn, _vc, _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
source_files = [(name, (SRC / name).read_text(encoding="utf-8")) for name in ORDER if (SRC / name).exists()]
runtime_prefix = "var GOAT_API_URL = " + json.dumps(goat_api_url) + ";\n" + build_js + "var GOAT_WEB_BUILD = false;\n"
common_prefix = runtime_prefix + ERAS_DATA_JS

# The public web build stays as one self-contained page with its existing startup behavior.
web_js = "var P3D_ASSET_PACK = " + json.dumps(asset_pack, separators=(",", ":")) + ";\n" + common_prefix + "\n".join(source for _, source in source_files)
for old, new in (
    ("var WEB_BUILD = false;", "var WEB_BUILD = true;"),
    ("var NO_ADS = false;", "var NO_ADS = true;"),
):
    if web_js.count(old) != 1:
        raise SystemExit(f"Expected one web build marker: {old}")
    web_js = web_js.replace(old, new, 1)
web_js = web_js.replace("</script", "<" + chr(92) + "/script")

# The Android WebView uses the same game sources/UI, but yields between modules
# and keeps the large locale/model payloads inert until they are actually needed.
mobile_sources = [("runtime-config", runtime_prefix + ERAS_PARTS[0])] + [("eras-data-%d" % i, part) for i, part in enumerate(ERAS_PARTS[1:], 1)]
mobile_sources.extend((name, source) for name, source in source_files if name not in LANG_FILES)
mobile_js = list(mobile_sources)
for old, new in (
    ("var WEB_BUILD = false;", "var WEB_BUILD = true;"),
    ("var NO_ADS = false;", "var NO_ADS = true;"),
):
    found = [i for i, (_, source) in enumerate(mobile_js) if old in source]
    if len(found) != 1:
        raise SystemExit(f"Expected one mobile build marker: {old}")
    i = found[0]
    name, source = mobile_js[i]
    mobile_js[i] = (name, source.replace(old, new, 1))
module_ids = ["camino-module-%03d" % i for i in range(len(mobile_js))]
MODULE_MARKUP = "\n".join(
    '<script type="text/plain" id="' + module_ids[i] + '">' + source.replace("</script", "<" + chr(92) + "/script") + '</script>'
    for i, (_, source) in enumerate(mobile_js)
)
MODULE_BOOTSTRAP = """(function () {
  var ids = %s, index = 0, splash = document.querySelector('.boot-screen'), booting = true, failed = false, executingModule = false;
  function fail(error) {
    if (failed) return;
    failed = true; booting = false;
    if (window.console && console.error) console.error('No se pudo iniciar el juego', error);
    var app = document.getElementById('app');
    if (app) app.innerHTML = '<main role="alert" style="padding:24px;color:#fff;background:#0b1417;font:16px system-ui"><h1>No se pudo iniciar el juego</h1><p>Recarga la página para volver a intentarlo.</p><button type="button" onclick="location.reload()">Recargar</button></main>';
  }
  window.addEventListener('error', function (event) {
    if (!booting || !executingModule) return;
    if (event && event.target && event.target !== window) return;
    fail(event.error || event.message || 'Error JavaScript al iniciar');
  });
  function next() {
    if (failed) return;
    var data = document.getElementById(ids[index]);
    if (!data) { fail(new Error('Falta el módulo ' + ids[index])); return; }
    try {
      var script = document.createElement('script');
      script.textContent = data.textContent || '';
      executingModule = true;
      (document.head || document.documentElement).appendChild(script);
      script.parentNode.removeChild(script);
      data.parentNode.removeChild(data);
    } catch (error) { fail(error); return; }
    finally { executingModule = false; }
    index++;
    if (splash && index %% 10 === 0) {
      var status = splash.querySelector('[data-boot-status]');
      if (status) status.textContent = 'Cargando el juego… ' + Math.round(index * 100 / ids.length) + '%%';
    }
    if (index < ids.length) setTimeout(next, 0);
    else {
      booting = false;
      if (!window.UIX || typeof window.UIX.ui !== 'function') fail(new Error('El motor no terminó de inicializarse'));
    }
  }
  setTimeout(next, 0);
})();""" % json.dumps(module_ids)
connect_src = goat_api_url if goat_api_url else "'none'"

ICON = base64.b64encode((SRC / "icon96.png").read_bytes()).decode() if (SRC / "icon96.png").exists() else ""
head = f"""<title>Fútbol: Camino a la Leyenda</title>
<link rel="icon" href="data:image/png;base64,{ICON}">
<link rel="apple-touch-icon" href="data:image/png;base64,{ICON}">
<meta name="theme-color" content="#0b1417">
<style>
{css}
</style>
"""
html_head = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src {connect_src}; form-action 'none'; base-uri 'none'">
{head}</head>
"""

LOADING_SCREEN = """<div class="boot-screen" role="status" aria-live="polite">
  <div class="boot-card">
    <div class="boot-mark" aria-hidden="true"><span>⚽</span></div>
    <p class="boot-kicker">CAMINO A LA LEYENDA</p>
    <h1 class="boot-title">Preparando el juego</h1>
    <p class="boot-status" data-boot-status>Cargando el juego…</p>
    <div class="boot-track" aria-hidden="true"><i></i></div>
  </div>
</div>"""

WEB_BOOTSTRAP = """(function () {
  var source = document.getElementById('web-game-source');
  function fail() {
    var app = document.getElementById('app');
    if (app) app.innerHTML = '<div class="boot-screen" role="alert"><div class="boot-card"><h1 class="boot-title">No se pudo iniciar el juego</h1><p class="boot-status">Recarga la página para volver a intentarlo.</p><button type="button" class="btn pri" onclick="location.reload()">Recargar</button></div></div>';
  }
  function launch() {
    if (!source || !source.parentNode) { fail(); return; }
    var script = document.createElement('script');
    script.textContent = source.textContent || '';
    source.parentNode.removeChild(source);
    try {
      (document.head || document.documentElement).appendChild(script);
      script.parentNode.removeChild(script);
    } catch (error) { fail(); return; }
    if (!document.querySelector('#app main')) fail();
  }
  if (window.requestAnimationFrame) window.requestAnimationFrame(function () { window.setTimeout(launch, 0); });
  else window.setTimeout(launch, 32);
})();"""

web_html = html_head + f"""<body>
<div id="app">{LOADING_SCREEN}</div>
<script type="text/plain" id="web-game-source">{web_js}</script>
<script>
{WEB_BOOTSTRAP}
</script>
</body>
</html>
"""
mobile_html = html_head + f"""<body>
<div id="app">{LOADING_SCREEN}</div>
{asset_markup}
{LANG_MARKUP}
{MODULE_MARKUP}
<script>
{MODULE_BOOTSTRAP}
</script>
</body>
</html>
"""

web_page = ROOT / "dist" / "jugar" / "juego.html"
web_page.parent.mkdir(parents=True, exist_ok=True)
web_page.write_text(web_html, encoding="utf-8")
mobile_page = ROOT / "dist" / "android" / "jugar" / "juego.html"
mobile_page.parent.mkdir(parents=True, exist_ok=True)
mobile_page.write_text(mobile_html, encoding="utf-8")

# Do not ship the stale v5.2 bundle from public/; the generated v5.17/67 game
# is now the only engine used by the Web page and Android WebView.
stale_bundle = ROOT / "dist" / "camino-engine.js"
if stale_bundle.exists():
    stale_bundle.unlink()

print("web game.html", round(len(web_html) / 1024), "KB · build", _vn, "(code", _vc, ")")
print("Android game.html", round(len(mobile_html) / 1024), "KB ·", len(module_ids), "yielded modules")
