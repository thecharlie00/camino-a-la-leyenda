#!/usr/bin/env python3
"""real/divs/*.json → src/data-es.js (Primera, Segunda y Tercera Federación) + traducciones de sus nombres."""
import json, os
DIVS = [("primera", "ESP3", "Primera Federación", 3, 66, 58, 2, "ESP4", 0.35),
        ("segunda", "ESP4", "Segunda Federación", 4, 59.5, 51.5, 2, "ESP5", 0.2),
        ("tercera", "ESP5", "Tercera Federación", 5, 53, 44, 1, None, 0.12)]
# total que baja de cada división = total que sube de la siguiente
up_total = {}
for f, dv, dvn, t, top, bot, upN, down, w in DIVS:
    up_total[dv] = upN * len(json.load(open(f"real/divs/{f}.json"))["groups"])
L = []
for f, dv, dvn, t, top, bot, upN, down, w in DIVS:
    d = json.load(open(f"real/divs/{f}.json"))
    ng = len(d["groups"])
    for k, g in enumerate(d["groups"]):
        no = k + 1
        lg = {"id": f"{dv}{no:02d}", "c": "ES", "n": f"{dvn} · Grupo {no}", "t": t, "top": top - (k % 3) * 0.6, "bot": bot - (k % 3) * 0.6, "w": w, "gs": 0.5,
              "clubs": "|".join(g["clubs"]), "dv": dv, "dvn": dvn, "gno": no, "upN": upN, "xl": True}
        if g.get("region"): lg["reg"] = g["region"]
        if down:
            lg["down"] = down; lg["rel"] = -(-up_total[down] // ng)
        L.append(lg)
js = "/* divisiones del fútbol español por debajo de LaLiga Hypermotion (grupos 2026/27) */\n"
js += "DATA.leagues.forEach(function (l) { if (l.id === \"ESP2\") { l.down = \"ESP3\"; l.rel = %d; } });\n" % up_total["ESP3"]
js += "DATA.leagues = DATA.leagues.concat(" + json.dumps(L, ensure_ascii=False) + ");\n"
open("src/data-es.js", "w").write(js)
print(len(L), "grupos", sum(len(l["clubs"].split("|")) for l in L), "clubes")
# traducciones de los nombres de grupo
G = {"en": "Group", "de": "Gruppe", "it": "Girone", "fr": "Groupe"}
for lang, gw in G.items():
    o = {}
    for l in L:
        o[l["n"]] = f"{l['dvn']} · {gw} {l['gno']}"
    o["Grupo {n}"] = gw + " {n}"
    os.makedirs(f"i18n/{lang}", exist_ok=True)
    json.dump(o, open(f"i18n/{lang}/divs.json", "w"), ensure_ascii=False, indent=0)
