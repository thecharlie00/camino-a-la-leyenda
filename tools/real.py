#!/usr/bin/env python3
"""real/raw/*.json → src/real.js con nombres versionados (nunca los reales)."""
import json, glob, sys
sys.path.insert(0, "tools")
from pseudo import versionar
POS = set("POR LD DFC LI MCD MC MD MI MCO ED EI DC".split())
codes = {l.split("\t")[0] for l in open("real/countries.tsv").read().splitlines()[1:] if l.strip()}
out, warn, n = {}, [], 0
for f in sorted(glob.glob("real/raw/*.json")):
    d = json.load(open(f))
    names = {c["club"] for c in json.load(open(f.replace("raw", "in")))["clubs"]}
    for c in d["clubs"]:
        if c["club"] not in names: warn.append("club desconocido " + c["club"]); continue
        ps, seen = [], set()
        for p in c["players"]:
            fn, ln = (p.get("fn") or "").strip(), (p.get("ln") or "").strip()
            if not ln and fn: fn, ln = "", fn
            if not ln or (fn, ln) in seen: continue
            seen.add((fn, ln))
            pos = p.get("pos"); nat = p.get("nat")
            if nat == "IL": continue  # sin nada relacionado con Israel
            if pos not in POS: warn.append("pos " + str(pos)); continue
            if nat not in codes: warn.append("nat " + str(nat)); nat = ""
            try: age, ovr = int(p["age"]), int(round(float(p["ovr"])))
            except Exception: continue
            a, b = versionar(fn, ln, c["club"])
            ps.append([a, b, pos, max(15, min(42, age)), max(40, min(94, ovr)), nat])
        co = c.get("coach") or ""
        cf, cl = (co.split(" ", 1) + [""])[:2] if " " in co else ("", co)
        cv = " ".join(x for x in versionar(cf, cl, "dt" + c["club"]) if x) if co else ""
        out[c["club"]] = {"co": cv, "p": ps}; n += len(ps)
js = "/* plantillas 2026/27 con nombres versionados (estilo PES): se parecen a los reales sin serlo */\nvar REAL = {y: 2026, c: " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "};\n"
open("src/real.js", "w").write(js)
print(len(out), "clubes", n, "jugadores", round(len(js) / 1024), "KB; avisos:", len(warn), sorted(set(warn))[:15])
