# Current squads for the game (research task)

The football game needs the **current first-team squads and head coaches** (season 2026/27, i.e. after the summer 2026
transfer window that closed on 1 September 2026; today is October 2026) for a list of clubs. The names will later be
transformed automatically (the game never shows them verbatim), but the underlying data must be accurate.

## Input

`real/in/<id>.json` → `{"id", "league", "country", "clubs": [{"club": "<exact club name used by the game>", "gameRating": 78.5}, …]}`.
The `club` string is the game's key: copy it **exactly** into your output (accents included), even if it is a Spanish
spelling (e.g. "Bayern Múnich", "Olympique de Marsella"). `gameRating` is the club's strength in the game (≈ average
rating of its best XI) — use it to calibrate the player ratings you estimate.

Country codes: `real/countries.tsv` (code, Spanish name). Use ONLY those codes (England = ENG, Scotland = SCO, Wales = WAL,
Northern Ireland = NIR, USA = US, South Korea = KR, Ivory Coast = CI, DR Congo = CD, Cape Verde = CV, Kosovo = XK if present…).
If a nationality is missing from the list, use the closest football nationality the player represents, else the club's country.

## Output

Write `real/raw/<id>.json` (UTF-8, valid JSON):

```json
{"id": "premier", "league": "Premier League", "season": "2026/27", "asOf": "2026-10",
 "clubs": [
  {"club": "Arsenal", "coach": "Mikel Arteta", "src": "web",
   "players": [
     {"fn": "David", "ln": "Raya", "pos": "POR", "age": 31, "nat": "ES", "ovr": 86},
     {"fn": "", "ln": "Gabriel", "pos": "DFC", "age": 28, "nat": "BR", "ovr": 86}
   ]}
 ]}
```

- `fn` / `ln`: first name and surname as commonly used in the media / on the shirt. Players known by a single name
  (Pedri, Rodri, Casemiro, Raphinha…) → `"fn": ""` and the name in `ln`. Keep accents.
- `pos`: the player's main position, one of the game codes:
  `POR` GK · `LD` right back/right wing-back · `DFC` centre back · `LI` left back/left wing-back · `MCD` defensive midfielder ·
  `MC` central midfielder · `MD` right midfielder · `MI` left midfielder · `MCO` attacking midfielder · `ED` right winger ·
  `EI` left winger · `DC` striker/centre forward.
- `age`: age in October 2026 (integer).
- `nat`: country code from `real/countries.tsv`.
- `ovr`: overall rating on an EA Sports FC-like scale (40–94). Calibrate with `gameRating`: the club's best eleven should
  average close to it (± 3). Rough guide: world-class stars 88–91, top-club starters 83–87, good top-five-league starters
  76–83, squad players and youngsters lower; the exact value matters less than the order within the squad.
- `coach`: the current head coach (October 2026). If interim, give the interim coach.
- `src`: `"web"` if you verified the squad online for 2026/27, `"memory"` if you had to rely on your own knowledge.
- 22–30 players per club: the first-team squad (include the 3 goalkeepers; skip youth/B-team players who are not in the
  first-team squad; players loaned OUT are not in the squad; players loaned IN are).

## How

Use web search / web fetch to check every club's current squad after the summer 2026 window (Wikipedia club pages
"Current squad" / "Players" section, the club's official site, or season pages like "2026–27 <Club> season"). Transfermarkt
may be blocked; that's fine. Cross-check the biggest summer transfers of the league. Do not invent players: if you cannot
confirm a player is still at the club, leave him out (the game fills gaps itself). Work club by club and write the output
file progressively (rewrite the whole JSON each time) so partial work is never lost.

When finished, validate: `python3 -c "import json;d=json.load(open('real/raw/<id>.json'));print(len(d['clubs']), sum(len(c['players']) for c in d['clubs']))"`
and make sure every `club` value matches the input exactly. Your final message: one line per club with the number of players
and `web`/`memory`, plus anything doubtful.

## Budget (important)
Work mainly from your own football knowledge (squads as of mid-2026), then use **at most ~12 web searches/fetches in
total** to check the biggest summer-2026 moves and coach changes of this league. Mark clubs you could not check with
`"src": "memory"`. Write the file early and update it as you go.
