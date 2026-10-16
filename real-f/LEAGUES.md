# Women's leagues: club lists only (research task)

For each women's league below, list the clubs of the **2026/27 season** (or the 2026 season for calendar-year leagues),
**ordered from strongest to weakest** (last table / current standings), and give a rough `teamOvr` for the strongest and the
weakest club on an EA FC women's scale (top European clubs ≈ 85–88, mid WSL/Liga F ≈ 72–76, weak top-flight clubs in
smaller countries ≈ 55–62).

Club naming: if the women's team belongs to a club whose men's name the game already uses (see `gameClubNames` from the
men's data, file `real-f/game-clubs.json`, keyed by country code), use that exact string. Otherwise use the club's
common short name without "Women/Femenino/Frauen/Feminino/Vrouwen/Femminile" etc.

Leagues (game slot → league):
- ENG2 → Women's Super League 2 (England)
- ESP2 → Primera Federación femenina (Spain, second tier, single group)
- GER2 → 2. Frauen-Bundesliga
- FRA2 → Seconde Ligue (France, second tier women)
- ITA2 → Serie B femminile
- POR1 → Liga BPI (Portugal)
- NED1 → Eredivisie Vrouwen
- BEL1 → Belgian Women's Super League
- SCO1 → Scottish Women's Premier League (SWPL 1)
- SWE1 → Damallsvenskan
- NOR1 → Toppserien
- DEN1 → Kvindeligaen (Gjensidige Kvindeliga)
- AUT1 → ÖFB Frauen-Bundesliga
- SUI1 → Women's Super League (Switzerland, AXA Women's Super League)
- CZE1 → Czech women's first league
- MEX1 → Liga MX Femenil
- BRA1 → Brasileirão Feminino A1
- ARG1 → Campeonato Femenino (Argentina top flight)
- COL1 → Liga Femenina (Colombia)
- AUS1 → A-League Women
- JPN1 → WE League
- KOR1 → WK League
- CHN1 → Chinese Women's Super League
- KSA1 → Saudi Women's Premier League
- RSA1 → SAFA Women's League (Hollywoodbets Super League)

Output: `real-f/leagues.json` =
`{"ENG2": {"league": "...", "top": 74, "bot": 60, "clubs": ["strongest", "...", "weakest"]}, ...}`
Work from your own knowledge, with at most ~15 web searches in total to check club lists that changed recently.
Write the file early and rewrite as you go. Final message: one line per league with the number of clubs.
