# Women's football squads for the game (research task)

The football game now has a **women's football mode**. For one top women's league you must provide the clubs of the
**2026/27 season** (today is October 2026) ordered by strength, with each club's **current first-team squad and head coach**.
The names will later be transformed automatically (the game never shows them verbatim), but the data must be accurate.

## Input
`real-f/in/<id>.json` → `{"id", "slot", "league", "country", "gameClubNames": [...]}`.
`gameClubNames` = the names the game already uses for men's clubs of that country. **If a women's team belongs to one of
those clubs, use that exact string** as its `club` (e.g. "Chelsea", "FC Barcelona", "Bayern Múnich", "Olympique de Lyon").
Otherwise use the club's common short name without "Women"/"Femenino"/"Frauen" (e.g. "London City Lionesses",
"Portland Thorns", "Madrid CFF", "Paris FC"). NWSL clubs are all new names (e.g. "Orlando Pride", "Kansas City Current").

Country codes: `real/countries.tsv` (code, Spanish name). Use ONLY those codes (England = ENG, Scotland = SCO, Wales = WAL,
Northern Ireland = NIR, USA = US, South Korea = KR…).

## Output
Write `real-f/raw/<id>.json` (UTF-8, valid JSON):
```json
{"id": "wsl", "slot": "ENG1", "league": "Women's Super League", "season": "2026/27", "asOf": "2026-10",
 "clubs": [
  {"club": "Chelsea", "teamOvr": 86, "coach": "Sonia Bompastor", "coachG": "f", "src": "web",
   "players": [ {"fn": "Hannah", "ln": "Hampton", "pos": "POR", "age": 25, "nat": "ENG", "ovr": 85} ]}
 ]}
```
- `clubs`: ALL clubs of the league in 2026/27, **ordered from strongest to weakest** (use last season's table, current
  standings and summer signings). `teamOvr` = the average rating of the club's best XI on the scale below.
- `coach`: current head coach (October 2026; interim if so). `coachG`: "f" or "m".
- `fn`/`ln`: as commonly used in the media; single-name players → `"fn": ""`, name in `ln`. Keep accents.
- `pos`: main position: `POR` GK · `LD` RB/RWB · `DFC` CB · `LI` LB/LWB · `MCD` DM · `MC` CM · `MD` RM · `MI` LM ·
  `MCO` AM · `ED` RW · `EI` LW · `DC` ST.
- `age`: age in October 2026. `nat`: code from `real/countries.tsv`.
- `ovr`: rating on an EA Sports FC women's scale (40–93). World-class stars 89–92 (e.g. Aitana Bonmatí, Alexia Putellas,
  Sophia Wilson, Lauren James…), top-club starters 82–88, good league starters 72–80, weaker clubs' starters 62–70.
  Make it consistent with EA FC 26 women's ratings where you know them; the order within a squad matters most.
- 20–28 players per club (3 goalkeepers). First-team only; players loaned OUT are not in the squad; loaned IN are.
- `src`: "web" if you verified the squad for 2026/27 online, else "memory".

## How
Work mainly from your own knowledge of women's football (squads as of mid-2026), then use **at most ~12 web searches /
fetches in total** to check the league's club list for 2026/27 (promotions/relegations, expansions), the biggest
summer-2026 transfers and coach changes. Do not invent players: if unsure a player is still at the club, leave her out
(the game fills gaps). If you know little about a small club, include the players you are reasonably sure of (≥ 10).
Write the file early and rewrite it as you go so partial work is never lost.

Validate: `python3 -c "import json;d=json.load(open('real-f/raw/<id>.json'));print(len(d['clubs']), sum(len(c['players']) for c in d['clubs']))"`
Final message: one line per club (players, web/memory) plus anything doubtful.
