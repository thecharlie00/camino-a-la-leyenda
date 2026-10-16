# Translating the game texts

Mobile football career game ("Camino a la Leyenda"): player career, manager career and "create your club" mode.
Keys are Spanish source strings. Input: `i18n/todo/partK.json` → `{"<Spanish key>": {"ctx": "<source line>", "where": "file:line", "note": …}}`.
Output: `i18n/<lang>/partK.json` → `{"<Spanish key, copied EXACTLY>": "<translation>", …}` — every key of the input, valid JSON, UTF-8.

Rules
- Copy each key byte-for-byte (accents, punctuation, spaces, HTML). Only the value is translated.
- Keep every placeholder `{name}` exactly (same names, may move position); keep HTML tags like `<b>…</b>` around the equivalent words.
- `note: plural:singular` / `plural:plural` → the singular or plural form of a count phrase (`{n}`).
- Tone: lively sports-game / football-press register, second person singular informal ("you" / "du" / "tu" / "tu"). Keep it concise: texts appear on buttons, chips and cards on a phone.
- Spanish "el {club}" → adapt naturally: EN usually no article ("{club} want…"), DE no article mostly ("{club} will dich"), IT/FR article only where natural ("le {club}" is fine in FR, "il {club}"/"l'" in IT is fine). French elision before vowels (de → d') is fixed automatically before capitalised names.
- Proper nouns of competitions stay as in that language's football media (Champions League, Europa League, Copa Libertadores…). Country names: the standard name in the target language. National cups: their usual name (Copa del Rey → EN "Copa del Rey", DE "Copa del Rey", FR "Coupe du Roi", IT "Coppa del Re"; FA Cup stays FA Cup; DFB-Pokal stays…). Spanish descriptive league names ("Bundesliga austriaca", "Superliga danesa") → the natural name in the target language ("Austrian Bundesliga", "österreichische Bundesliga"…).
- Short labels (positions, chips, buttons, month abbreviations "Ago–Sep") stay short.
- Abbreviations: "PJ" (played) EN "Apps"/DE "Sp."/IT "Pres."/FR "MJ"; "G" goals; "A" assists — keep them short.
- Glossary ES → EN / DE / IT / FR:
  míster/entrenador → manager / Trainer / allenatore (mister) / entraîneur · directiva → board / Vorstand / dirigenza / direction ·
  afición → fans / Fans / tifosi / supporters · vestuario → dressing room / Kabine / spogliatoio / vestiaire · cantera → academy / Jugend / vivaio / centre de formation ·
  Balón de Oro → Ballon d'Or / Ballon d'Or / Pallone d'Oro / Ballon d'Or · Bota de Oro → Golden Boot / Goldener Schuh / Scarpa d'Oro / Soulier d'Or ·
  Pichichi → top scorer / Torschützenkönig / capocannoniere / meilleur buteur · cedido → on loan / ausgeliehen / in prestito / prêté ·
  fichaje → signing / Transfer / acquisto / recrue · prestigio → reputation / Ansehen / prestigio / prestige · química → chemistry / Chemie / intesa / cohésion ·
  media (rating) → OVR / Gesamtstärke / valutazione / note · potencial → potential / Potenzial / potenziale / potentiel · tramo → stage / Abschnitt / fase / période ·
  Salón de la fama → Hall of Fame / Hall of Fame / Hall of Fame / Panthéon.
- Event titles, categories and "Pasó de verdad" anecdotes refer to real football history: translate faithfully.

When done, validate: `python3 -c "import json;a=json.load(open('i18n/todo/partK.json'));b=json.load(open('i18n/<lang>/partK.json'));print(len(a),len(b),[k for k in a if k not in b][:5])"`
and `node tools/i18n.js check` (look at your language's "huecos distintos": must not grow because of your file).
