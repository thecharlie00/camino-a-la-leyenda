#!/usr/bin/env python3
"""Fútbol femenino: real-f/raw/*.json + real-f/leagues.json → src/data-f.js (DATA.leaguesF) y src/real-f.js (REALF)
   Las ligas son las mismas (mismos id y orden) que las masculinas; donde hay datos, con sus clubes reales femeninos."""
import json, glob, re, subprocess, sys
sys.path.insert(0, "tools")
from pseudo import versionar
POS = set("POR LD DFC LI MCD MC MD MI MCO ED EI DC".split())
codes = {l.split("\t")[0] for l in open("real/countries.tsv").read().splitlines()[1:] if l.strip()}
men = json.loads(subprocess.run(["node", "-e", 'eval(require("fs").readFileSync("src/data.js","utf8")+require("fs").readFileSync("src/data-es.js","utf8"));console.log(JSON.stringify(DATA.leagues))'],
                                capture_output=True, text=True, check=True).stdout)
raw = {}
for f in sorted(glob.glob("real-f/raw/*.json")):
    d = json.load(open(f)); raw[d["slot"]] = d
lists = json.load(open("real-f/leagues.json"))
REL = {"ENG1": 1, "ESP1": 2, "GER1": 2, "FRA1": 2, "ITA1": 2, "ENG2": 2, "ESP2": 3}
WEAK = {"KSA1", "QAT1", "UAE1", "IRN1", "IND1", "EGY1", "MAR1", "TUN1", "ALG1"}
used, out, warn = set(), [], []
# primero las ligas con datos (para que sus clubes no se repitan en otras), luego el resto en su orden
def club_list(L):
    if L["id"] in raw:
        cl = raw[L["id"]]["clubs"]; tops = [c.get("teamOvr") or 70 for c in cl]
        return [c["club"] for c in cl], max(tops), min(tops)
    if L["id"] in lists:
        x = lists[L["id"]]; return list(x["clubs"]), x["top"], x["bot"]
    return None, None, None
for L in men:
    F = dict(L)
    names, top, bot = club_list(L)
    if names:
        names = [n for n in names if n not in used]
        if len(names) < 10:   # ligas muy cortas: se completan con clubes de la lista masculina
            for n in L["clubs"].split("|"):
                if len(names) >= 10: break
                if n not in used and n not in names: names.append(n)
        F["top"], F["bot"] = top, bot
    else:
        names = [n for n in L["clubs"].split("|") if n not in used]
        d = 20 if L["id"] in WEAK else (12 if L["id"].startswith("ESP") else 13)
        F["top"], F["bot"] = max(48, L["top"] - d), max(44, L["bot"] - d + 3)
        if F["bot"] >= F["top"]: F["bot"] = F["top"] - 4
    used.update(names)
    F["clubs"] = "|".join(names)
    if L["id"] in REL and F.get("rel"): F["rel"] = REL[L["id"]]
    out.append(F)
js = "/* fútbol femenino: mismas ligas que el masculino, con los clubes femeninos reales donde hay datos (generado por tools/realf.py) */\nDATA.leaguesF = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
open("src/data-f.js", "w").write(js)
# plantillas reales con nombres versionados
real, n = {}, 0
for slot, d in raw.items():
    for c in d["clubs"]:
        ps, seen = [], set()
        for p in c.get("players", []):
            fn, ln = (p.get("fn") or "").strip(), (p.get("ln") or "").strip()
            if not ln and fn: fn, ln = "", fn
            if not ln or (fn, ln) in seen: continue
            seen.add((fn, ln))
            pos, nat = p.get("pos"), p.get("nat")
            if nat == "IL": continue
            if pos not in POS: warn.append("pos " + str(pos)); continue
            if nat not in codes: warn.append("nat " + str(nat)); nat = ""
            try: age, ovr = int(p["age"]), int(round(float(p["ovr"])))
            except Exception: continue
            a, b = versionar(fn, ln, "w" + c["club"])
            ps.append([a, b, pos, max(15, min(42, age)), max(40, min(94, ovr)), nat])
        co = (c.get("coach") or "").strip()
        cv = ""
        if co and c.get("coachG", "f") == "f":   # en el modo femenino las entrenadoras son mujeres
            cf, cl = (co.split(" ", 1) + [""])[:2] if " " in co else ("", co)
            cv = " ".join(x for x in versionar(cf, cl, "wdt" + c["club"]) if x)
        real[c["club"]] = {"co": cv, "p": ps}; n += len(ps)
js2 = "/* fútbol femenino: plantillas 2026/27 con nombres versionados (estilo PES) */\nvar REALF = {y: 2026, c: " + json.dumps(real, ensure_ascii=False, separators=(",", ":")) + "};\n"
open("src/real-f.js", "w").write(js2)
print(len(out), "ligas ·", len(real), "clubes reales ·", n, "jugadoras ·", round(len(js2) / 1024), "KB; avisos:", len(warn), sorted(set(warn))[:10])
for F in out:
    if F["id"] in raw or F["id"] in lists: print(" ", F["id"], F["top"], F["bot"], len(F["clubs"].split("|")), F["clubs"].split("|")[:3])
