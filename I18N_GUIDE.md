# Making the game translatable (conversion guide)

The game is a single-page HTML5 football career game written in vanilla ES5 JavaScript. All visible text is Spanish.
We are adding 5 languages (es = source, en, de, it, fr) with a **gettext-style** layer: the Spanish text itself is the
translation key. Your job in this step is ONLY to wrap user-visible strings so they can be translated. Translations are
written later by other people from the extracted keys — you do not translate anything now.

The API lives in `src/i18n.js` (global functions, always loaded first):

| function | use |
|---|---|
| `tr("Texto con {hueco}", {hueco: valor})` | translate a template and fill `{placeholders}` |
| `trn(n, "{n} gol", "{n} goles", {…})` | singular/plural by `n` (`n === 1` → singular). `{n}` is filled automatically |
| `N_("Texto")` | marker only (returns the same string). Use for literals stored in module-level data; translate at display time with `tr(variable)` |
| `trComp(name)` | translate a competition / trophy / league name stored in Spanish, keeping a trailing year ("Mundial 2030") |
| `natName(i)`, `lgName(li)` | translated country / league name |
| `posName(code)`, `posAb(code)` | translated full position name / per-language position abbreviation (codes like "DC", "MCO" are data) |
| `attAb(k)` | translated attribute abbreviation (RIT, TIR…) |
| `ord(n)` | ordinal: 3º / 3rd / 3. / 3e |
| `fmtDec(x, d)`, `fmtMoney(x)`, `fmtFol(k)` | numbers with the right decimal separator / money / followers |
| `awd(k, "Plantilla {x}", {x: raw}, y)` + `awardName(a)` | awards that are stored and re-rendered in any language |
| `trParams(p)` | translates every string param that is a stored Spanish name (comp/league/country) |
| `onLang(fn)` | runs `fn` now and again whenever the language changes |

## Rules

1. **Wrap every user-visible Spanish string** with `tr()` / `trn()`. Keep **whole sentences** in one template; never build a
   sentence by concatenating separately translated pieces (word order changes between languages).
   ```js
   // before
   "Firmas hasta " + (S.yr + yrs + 1) + ". La grada corea tu nombre."
   // after
   tr("Firmas hasta {year}. La grada corea tu nombre.", {year: S.yr + yrs + 1})
   ```
2. Templates must be **string literals** written directly as the argument (`tr("…")`, `trn(n, "…", "…")`, `N_("…")`,
   `awd(k, "…", …)`). No variables, no `+` inside the template, no backticks. Conditional wording → one `tr()` per branch:
   `won ? tr("¡Campeones!") : tr("Subcampeones")`.
3. **Placeholders** use ASCII names in braces: `{club}`, `{n}`, `{year}`, `{min}`, `{score}`, `{pos}`, `{name}`… Pass every
   value through the params object. Prefer meaningful names. The same placeholder may appear twice in a template.
4. **Values that are themselves Spanish words** must be translated before being passed as params:
   competition names → `trComp(c.n)`, league → `lgName(li)`, country → `natName(i)`, position → `posName(code)` or `posAb(code)`,
   round names ("Final", "Semifinales"…) → `tr(r.n)`, role names → `tr(role)`. Numbers that are shown with decimals →
   `fmtDec(x, 1)`; `x.toFixed(1).replace(".", ",")` → `fmtDec(x, 1)`; `n + "º"` → `ord(n)`.
5. **Plurals**: `n + (n === 1 ? " partido" : " partidos")` → `trn(n, "{n} partido", "{n} partidos")`.
6. **Do NOT translate** strings used as logic: ids, object keys, `k:` / `id:` / `tipo:` values, `case` labels, values compared
   with `===`, regexes, CSS classes, `data-*` attributes, storage keys, `console`/`Error` messages, position codes used as
   data ("DC", "POR"…). Some Spanish words are BOTH data and display (round names "Final"/"Semifinales"/"Cuartos"/"Octavos"/
   "Dieciseisavos"/"Treintaidosavos"/"Ronda previa"/"Playoff"/"Primera ronda", player roles "Estrella"/"Titular"/"Rotación"/
   "Suplente"/"Promesa"/"Reserva", focus/talent names…): keep the Spanish value in the data and logic, mark the literal with
   `N_()` where it is defined, and translate **where it is displayed** with `tr(value)`.
7. **Event definitions** — `EV({...})`, `MO({...})`, `MEV({...})`, `MMO({...})`: leave the static `title:`, `cat:` and `ref:`
   properties of the event object exactly as they are (plain Spanish). They are translated automatically when read.
   Everything produced inside functions (`text`, `opts`, `then`, helpers…) must use `tr()`: option fields `t` (button),
   `d` (description), `txt` (result text), `n` (short note), `lab` (outcome label), `ref` (option-level anecdote) etc.
8. **Module-level tables with display text** (evaluated once at load: e.g. `TALENT`, `FOCUS`, `ATT_NAMES`, `FX_LABEL`,
   `MENT_NAMES`, `ROT_NAMES`, `TRAITS`, `MFOCUS`, `MFX_LABEL`, `ROLES`, `BLOCKS` labels, `MCHIP`…). A `tr()` call at module
   level would freeze the language at load time, so either:
   - (a) mark the literals with `N_("…")` and call `tr(TABLE[k].n)` at every place where the text is shown; or
   - (b) declare `var TABLE;` and build it inside `onLang(function () { TABLE = { … tr("…") … }; });` (good for pure display
     tables used in many places — keep all non-text fields identical).
   Never leave a bare `tr()` at module level outside `onLang`.
9. **Awards**: `p.awards.push({k: "pom", n: "Jugador del mes (" + W.lg[li].n + ")", y: S.yr})` →
   `p.awards.push(awd("pom", "Jugador del mes ({lg})", {lg: W.lg[li].n}, S.yr))`. Pass names RAW (Spanish) — `awardName()`
   translates them at display time. News text built from the same award: `tr("Jugador del mes ({lg})", trParams({lg: W.lg[li].n}))`.
   Wherever the UI shows `a.n` of an award, use `awardName(a)`; for trophies (`t.n`) use `trComp(t.n)`.
10. **Stored text**: news/feed sentences stored in the save (`S.feed`, `S.bnews`, `x:` / `txt:` fields) may be stored already
    translated — they stay in the language that was active when they happened. That is accepted. But never store translated
    text in a field that the code later compares or uses as a key.
11. **HTML in `ui.js`**: keep markup outside the template when it wraps the whole text
    (`'<h3>' + tr("Plantilla") + '</h3>'`). Inline markup inside a sentence may stay in the template
    (`tr("Has marcado <b>{n}</b> goles", {n: n})`). Keep `h()` escaping on values exactly where the original escaped them
    (escape the param, not the template). `aria-label` / `title` / `placeholder` texts are visible too: translate them.
12. **Gender/articles**: keep the Spanish exactly as it is ("el {club}"). Translators adapt it.
13. Keep behaviour identical. ES5 only (`var`, `function`). Do not reformat or reorder unrelated code, do not rename functions.
    Proper nouns (club names, player names, "Champions League"…) need no wrapping when they are plain data; competition
    names in tables are handled via `trComp`.

## Checking your work

From `/home/claude/camino`:

- `node tools/i18n.js leftovers <file>` lists string literals that still look like visible Spanish (heuristic: review each
  hit — some are legitimate data/proper nouns). For a chunk use the chunk path: `node tools/i18n.js leftovers work/ui.js.part1.js`.
- `node tools/chunks.js check work/<file>.partK.js` checks syntax of the whole file with your chunk edited.
- `node tools/chunks.js test work/<file>.partK.js` also runs the simulations (engine files) or the UI smoke test (ui.js).
  They must end with `Problemas: 0` / `ERRORES: ninguno`.
- For whole files (not chunked): `node -e "require('acorn').parse(require('fs').readFileSync('src/<file>','utf8'),{ecmaVersion:2020})"`
  from `tools/` and `node test/sim.js 1 --mgr` + `node test/modes.js 1 3` + `node tools/smoke.js`.

If you work on a chunk, edit **only your chunk file**; other people are editing the other chunks at the same time.
