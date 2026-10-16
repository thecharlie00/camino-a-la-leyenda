# Spanish lower divisions 2026/27 (research task)

The game needs the club lists of the Spanish RFEF divisions for the **2026/27 season** (today: October 2026):
- Primera Federación (2 groups × 20 clubs) → output `real/divs/primera.json`
- Segunda Federación (5 groups × 18 clubs) → output `real/divs/segunda.json`
- Tercera Federación (18 groups × 18 clubs, regional) → output `real/divs/tercera.json`

Format:
```json
{"division": "Primera Federación", "season": "2026/27",
 "groups": [{"group": "Grupo 1", "region": "", "clubs": ["Club A", "Club B", …]}, …]}
```
- `clubs`: common Spanish name of each club as used in Spanish media (e.g. "Real Madrid Castilla", "Barça Atlètic",
  "CE Europa", "UE Cornellà", "Gimnàstic de Tarragona"). Order each group roughly from strongest (budget, favourites,
  last season's position) to weakest.
- `region`: for Tercera groups the autonomous community (e.g. "Cataluña"); empty otherwise.
- These clubs already exist in the game in higher divisions — do NOT include them even if in reality they now play in your
  division (just leave them out): Real Madrid, FC Barcelona, Atlético de Madrid, Athletic Club, Villarreal CF, Real Betis,
  Real Sociedad, Celta de Vigo, Sevilla FC, Valencia CF, CA Osasuna, Rayo Vallecano, Getafe CF, RCD Espanyol, Deportivo
  Alavés, Elche CF, Levante UD, Real Racing Club, RC Deportivo, Málaga CF, Girona FC, RCD Mallorca, Real Oviedo,
  UD Las Palmas, Real Valladolid, CD Leganés, UD Almería, Granada CF, Real Sporting, Cádiz CF, SD Eibar, FC Andorra,
  Córdoba CF, CD Castellón, Burgos CF, Albacete BP, CD Tenerife, AD Ceuta, CD Eldense, CE Sabadell, Real Sociedad B,
  Celta Fortuna.
- No duplicates across groups.

Use web search/fetch (Spanish Wikipedia pages like "Primera Federación 2026-27", "Segunda Federación 2026-27",
"Tercera Federación 2026-27", or rfef.es / news) — at most ~15 fetches. If a page for 2026/27 is not available, use the
best available information and say so. Write the file as soon as you have data; validate it with
`python3 -c "import json;d=json.load(open('<file>'));print([len(g['clubs']) for g in d['groups']])"`.
