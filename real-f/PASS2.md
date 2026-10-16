# Second pass: fill thin squads

Some clubs in `real-f/raw/<id>.json` have few or no players. Fill them following `real-f/README.md` (same format, same
rules), keeping everything already there unless you find it is wrong (player left the club → remove her).

This time you have a larger budget: **up to ~45 web searches / fetches**. Good sources: the Wikipedia page of each women's
club ("<Club> Women" / "<Club> (women)" / "<Club> Femenino" / "<Club> Frauen" / "<Club> féminines" / "<Club> Femminile")
which has a "Current squad"/"Players" table, the 2026–27 season pages, club official websites, Soccerway/FBref squad pages.
Prioritise clubs with the fewest players. Aim for ≥ 18 players per club, 2–3 goalkeepers each.
Rewrite the whole JSON after each club so nothing is lost; keep the club order and `teamOvr`s (adjust if clearly wrong).
Validate with the README command. Final message: one line per club with players before → after.
