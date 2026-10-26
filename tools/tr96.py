# Traducciones del lote 5.6 (decisiones). Lee tr96.txt (es ¦ en ¦ de ¦ it ¦ fr) y genera part96.json
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from tr90 import write
rows = [tuple(x.strip() for x in l.split("¦")) for l in open(os.path.join(os.path.dirname(__file__), "tr96.txt"), encoding="utf-8") if "¦" in l]
assert all(len(r) == 5 for r in rows), [r for r in rows if len(r) != 5][:3]
write("part96.json", rows)
