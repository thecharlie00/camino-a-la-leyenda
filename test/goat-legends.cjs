/* Leyendas del GOAT Ladder: mismos clubes y generador de nombres que el juego,
   comparación con la carrera activa, noticias de récord y pestaña propia en la ficha.
   node test/goat-legends.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const LANGS = ['es', 'en', 'de', 'it', 'fr'];
const MODES = ['player', 'manager'];
const PLAYER_METRICS = ['seasons', 'appearances', 'goals', 'assists', 'clean_sheets', 'trophies',
  'awards', 'international_caps', 'international_goals', 'clubs'];
const MANAGER_METRICS = ['seasons', 'wins', 'draws', 'losses', 'win_percentage', 'trophies',
  'unbeaten_seasons', 'promotions', 'clubs'];

/* ---------- 1. Datos y traducciones ---------- */
function world() {
  const ctx = {console, DATA: {}};
  vm.createContext(ctx);
  for (const file of ['data.js', 'data-es.js', 'data-f.js', 'names.js', 'goat-legends.js']) {
    vm.runInContext(fs.readFileSync(`legacy-game/src/${file}`, 'utf8'), ctx, {filename: file});
  }
  return ctx;
}

const ctx = world();
const G = ctx.GoatLegends;
assert.ok(G, 'the legends module publishes a global API');
assert.equal(G.schema, 1);
const legends = G.all();
assert.equal(G.count, legends.length);
assert.equal(legends.length, 14, 'fourteen legends: eight players and six managers');
assert.equal(new Set(legends.map((l) => l.id)).size, legends.length, 'legend ids are unique');
for (const mode of MODES) {
  const rows = G.list(mode);
  assert.equal(rows.length, mode === 'player' ? 8 : 6);
  assert.equal(rows.filter((l) => l.g === 'f').length, rows.length / 2, `${mode} legends include women and men`);
  assert.equal(rows.filter((l) => l.g === 'm').length, rows.length / 2);
}

/* Nombres ficticios: salen del propio generador del juego y no copian identidades reales. */
const first = new Set(), last = new Set();
for (const key of Object.keys(ctx.DATA.names || {})) {
  for (const pool of ['f', 'l']) for (const token of String(ctx.DATA.names[key][pool] || '').split(',')) if (token.trim()) (pool === 'f' ? first : last).add(token.trim());
}
for (const key of Object.keys(ctx.DATA.namesF || {})) {
  for (const pool of ['f', 'l']) for (const token of String(ctx.DATA.namesF[key][pool] || '').split(',')) if (token.trim()) (pool === 'f' ? first : last).add(token.trim());
}
const DENY = ['Messi', 'Ronaldo', 'Maradona', 'Pelé', 'Zidane', 'Cruyff', 'Iniesta', 'Xavi', 'Casillas',
  'Puyol', 'Haaland', 'Mbappé', 'Ronaldinho', 'Beckham', 'Guardiola', 'Buffon', 'Totti', 'Neymar'];
for (const legend of legends) {
  assert.ok(first.has(legend.fn), `${legend.fn} comes from the game's first-name pool`);
  assert.ok(last.has(legend.ln), `${legend.ln} comes from the game's surname pool`);
  for (const deny of DENY) {
    assert.ok(!G.fullName(legend).includes(deny), `${legend.id} avoids the real identity ${deny}`);
  }
  assert.ok(!/Maradona|Cruyff|Zidane/.test(G.fullName(legend)));
  for (const lang of LANGS) {
    assert.equal(typeof G._stories[legend.id][lang], 'string', `${legend.id} has a ${lang} story`);
    assert.ok(G._stories[legend.id][lang].length > 20, `${legend.id} ${lang} story is meaningful`);
  }
}
assert.equal(new Set(legends.map((l) => G.fullName(l))).size, legends.length, 'no repeated legend names');

/* Clubes reales del mundo del juego y ventanas temporales coherentes. */
const clubs = new Set();
for (const key of ['leagues', 'leaguesF']) {
  for (const league of ctx.DATA[key] || []) {
    for (const club of String(league.clubs || '').split('|')) if (club.trim()) clubs.add(club.trim());
  }
}
const eraRanges = fs.readdirSync('legacy-game/erascene/packs')
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(fs.readFileSync(`legacy-game/erascene/packs/${file}`, 'utf8')).years);
const inEra = (year) => eraRanges.some(([from, to]) => year >= from && year <= to);
for (const legend of legends) {
  assert.ok(clubs.has(legend.club), `${legend.id} plays for a club that exists in the game world`);
  assert.ok(legend.from < legend.to, `${legend.id} has a valid career window`);
  assert.ok(inEra(legend.era), `${legend.id} points to a playable era (${legend.era})`);
  assert.ok(legend.from <= legend.era && legend.era <= legend.to, `${legend.id} era falls inside its career`);
  assert.ok(['ESP', 'FRA', 'ITA', 'NOR', 'POR', 'NED'].includes(legend.nat));
}

/* Métricas coherentes con el modo y con el récord anunciado. */
for (const legend of legends) {
  const keys = legend.mode === 'player' ? PLAYER_METRICS : MANAGER_METRICS;
  assert.deepEqual(Object.keys(legend.metrics).sort(), keys.slice().sort(), `${legend.id} uses the ${legend.mode} metrics`);
  for (const key of keys) assert.equal(typeof legend.metrics[key], 'number', `${legend.id}.${key} is numeric`);
  assert.ok(keys.includes(legend.record.k), `${legend.id} record uses a ${legend.mode} metric`);
  assert.equal(legend.metrics[legend.record.k], G.metricValue(legend, legend.record.k));
  assert.ok(G.metricValue(legend, legend.record.k) > 0);
  if (legend.mode === 'manager') {
    const played = legend.metrics.wins + legend.metrics.draws + legend.metrics.losses;
    const rate = Math.round((legend.metrics.wins / played) * 100);
    assert.ok(Math.abs(rate - legend.metrics.win_percentage) <= 1, `${legend.id} win rate matches its record`);
    assert.ok(legend.metrics.trophies <= legend.metrics.seasons);
  } else {
    assert.ok(legend.metrics.appearances <= legend.metrics.seasons * 50, `${legend.id} appearances fit its seasons`);
    assert.ok(legend.metrics.trophies <= legend.metrics.seasons * 2);
  }
}

/* Cinco idiomas completos y con marcadores correctos. */
const baseKeys = Object.keys(G._text.es).sort();
for (const lang of LANGS) {
  assert.deepEqual(Object.keys(G._text[lang]).sort(), baseKeys, `${lang} legend copy is complete`);
  for (const key of baseKeys) assert.ok(String(G._text[lang][key]).length > 0, `${lang}.${key} is not empty`);
  for (const key of ['recordLine', 'clubLine', 'eraLine', 'newsBeaten', 'careerLegacy', 'cmpBehind']) {
    const vars = (value) => (String(value).match(/\{\w+\}/g) || []).sort();
    assert.deepEqual(vars(G._text[lang][key]), vars(G._text.es[key]), `${lang}.${key} keeps its placeholders`);
  }
}

/* Selección de idioma del propio módulo. */
const localized = vm.createContext({console, DATA: ctx.DATA});
vm.runInContext(fs.readFileSync('legacy-game/src/goat-legends.js', 'utf8'), localized, {filename: 'goat-legends.js'});
const LG = localized.GoatLegends;
assert.equal(LG.text('badge'), 'Leyenda del universo');
localized.LANG = 'en';
assert.equal(LG.text('badge'), 'Legend of the universe');
assert.match(LG.recordText(LG.byId('leg_ainhoa_prieto')), /289 goals/);
localized.LANG = 'de';
assert.match(LG.recordText(LG.byId('leg_ainhoa_prieto')), /289 Tore/);
assert.match(LG.story(LG.byId('leg_nerea_cano')), /Atlético/);
localized.LANG = 'fr';
assert.match(LG.text('cmpBehind', {gap: 3, value: 100}), /3.*100/);
localized.LANG = 'xx';
assert.equal(LG.text('badge'), 'Leyenda del universo', 'unknown languages fall back to Spanish');
assert.equal(LG.byId('nope'), null);

/* ---------- 2. Orden, comparación y noticias ---------- */
const prieto = G.byId('leg_ainhoa_prieto');
const order = G.sorted('player', 'goals').map((l) => l.metrics.goals);
assert.deepEqual(order, order.slice().sort((a, b) => b - a), 'legends are ranked by the chosen metric');
assert.deepEqual(G.sorted('player', 'goals').map((l) => l.id), G.sorted('player', 'goals').map((l) => l.id), 'sorting is stable');
assert.equal(G.sorted('player', 'goals')[0].id, 'leg_ainhoa_prieto', 'the top scorer is the Barcelona legend');
assert.equal(G.forClub('FC Barcelona', 'player').length, 1);
assert.equal(G.forClub('FC Barcelona', 'manager').length, 0);
assert.deepEqual([...G.forEra(2021, 'player').map((l) => l.id)].sort(), ['leg_alba_fuentes', 'leg_andreas_gustafsson']);
assert.equal(G.forEra(2025).length, 2);

const career = (metrics, club = 'FC Barcelona', mode = 'player') =>
  ({game_mode: mode, current_club: club, metrics});
assert.equal(G.compare(career({goals: 120}), prieto).state, 'behind');
assert.equal(G.compare(career({goals: 120}), prieto).gap, 169);
assert.equal(G.compare(career({goals: 289}), prieto).state, 'equal');
assert.equal(G.compare(career({goals: 290}), prieto).state, 'ahead');
assert.equal(G.compare(career({goals: 120}, 'Villarreal CF'), prieto).state, 'other-club', 'another club cannot chase the mark');
assert.equal(G.compare(null, prieto).state, 'none');
assert.equal(G.compare(career({goals: 10}, 'FC Barcelona', 'manager'), prieto).state, 'none');

const closest = G.closest(career({goals: 100}));
assert.equal(closest.legend.id, 'leg_ainhoa_prieto', 'the career sheet points to the club legend');
assert.equal(G.closest(career({goals: 100}, 'Millonarios')), null);

const flags = {};
const playerTotals = {goals: 120, appearances: 300, assists: 40, seasons: 10, trophies: 1, clubs: 1};
assert.equal(G.careerNews({mode: 'player', club: 'FC Barcelona', metrics: playerTotals, flags}).length, 0, 'below the record nothing is announced');
playerTotals.goals = 300;
const news = G.careerNews({mode: 'player', club: 'FC Barcelona', metrics: playerTotals, flags});
assert.equal(news.length, 1, 'beating the mark creates one news entry');
assert.equal(news[0].t, 'star');
assert.match(news[0].x, /Ainhoa Prieto/);
assert.match(news[0].x, /289 goles/);
assert.equal(flags.legendRec_leg_ainhoa_prieto, true, 'the record is flagged in the save');
assert.equal(G.careerNews({mode: 'player', club: 'FC Barcelona', metrics: playerTotals, flags}).length, 0, 'the same record is announced only once');
const villarrealFlags = {};
const villarreal = G.careerNews({mode: 'player', club: 'Villarreal CF', metrics: {goals: 999}, flags: villarrealFlags});
assert.equal(villarreal.length, 1, 'each club has its own record');
assert.match(villarreal[0].x, /Marc Caballero/);
assert.match(villarreal[0].x, /212 goles/);
const managerFlags = {};
const managerNews = G.careerNews({mode: 'manager', club: 'Ajax', metrics: {wins: 200, draws: 0, losses: 0, seasons: 15, trophies: 6, clubs: 1}, flags: managerFlags});
assert.equal(managerNews.length, 1);
assert.match(managerNews[0].x, /Matthijs Dekker/);
assert.match(managerNews[0].x, /198 victorias/);

/* ---------- 3. Pestaña «Leyendas» dentro de la ficha del juego ---------- */
function buildUI(extra = {}) {
  const calls = {list: 0, listCareers: 0};
  const listeners = {};
  const document = {
    getElementById: () => null, querySelector: () => null, body: {appendChild() {}}, documentElement: {appendChild() {}},
    createElement: () => ({id: '', className: '', textContent: '', appendChild() {}}),
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); }
  };
  const UIX = {
    actions: {}, sheets: {}, hk: {}, adds: [], sheet: null,
    add(name) { UIX.adds.push(name); },
    getSheet() { return UIX.sheet; },
    setSheet(sheet) { UIX.sheet = sheet; window.__goatSheet = sheet; },
    renderSheet() { UIX.renders = (UIX.renders || 0) + 1; }
  };
  const latests = extra.career === null ? null : {event_key: 'm:1', title: 'Gesta', club_name: 'FC Barcelona', competition_name: 'Liga', game_mode: 'player', event_type: 'match', metrics: {goals: 3}};
  const careers = extra.career === undefined ? {
    game_mode: 'player', title: 'Carrera de Leire', current_club: 'FC Barcelona', started_season: 2060,
    latest_season: 2075, metrics: {seasons: 15, appearances: 400, goals: 290, assists: 60, trophies: 6}, history: []
  } : extra.career;
  const service = {
    available: () => extra.available !== false,
    latest: () => latests,
    career: () => careers,
    list: () => { calls.list++; return Promise.resolve([]); },
    listCareers: () => { calls.listCareers++; return Promise.resolve([]); },
    canDelete: () => false,
    t: (key, params) => {
      const table = (window.GOAT_TEXT && window.GOAT_TEXT.es) || {};
      let value = table[key] == null ? key : table[key];
      if (params) value = String(value).replace(/\{(\w+)\}/g, (m, name) => (params[name] == null ? m : String(params[name])));
      return value;
    }
  };
  const window = {
    UIX, GoatLadder: service, GOAT_WEB_BUILD: false,
    localStorage: {getItem: () => null, setItem() {}, removeItem() {}},
    navigator: {}, confirm: () => true, document, PX: undefined
  };
  window.window = window;
  Object.assign(window, {addEventListener() {}, setTimeout, clearTimeout, Promise, console, JSON, Math, Date, String, Number, Array, Object, encodeURIComponent, decodeURIComponent});
  if (extra.legends !== false) {
    const sandbox = vm.createContext(window);
    vm.runInContext(fs.readFileSync('legacy-game/src/goat-legends.js', 'utf8'), sandbox, {filename: 'goat-legends.js'});
  }
  vm.createContext(window);
  vm.runInContext(fs.readFileSync('legacy-game/src/ui-goat.js', 'utf8'), window, {filename: 'ui-goat.js'});
  return {UIX, service, window, document, calls, listeners};
}

const env = buildUI();
env.UIX.actions.goatlegends();
const sheet = env.UIX.getSheet();
assert.equal(sheet.k, 'goat');
assert.equal(sheet.board, 'legends', 'the career button opens the legends board');
assert.equal(env.calls.list + env.calls.listCareers, 0, 'legends never hit the network');
const html = env.UIX.sheets.goat(sheet);
for (const name of ['Alba Fuentes', 'Ainhoa Prieto', 'Leire Gallego', 'Marc Caballero']) {
  assert.ok(html.includes(name), `${name} appears in the player legends board`);
}
assert.ok(!html.includes('Nerea Cano'), 'the player board does not mix in manager legends');
assert.match(html, /Leyenda del universo/);
assert.match(html, /Personajes ficticios del universo del juego/);
assert.match(html, /data-a="goatboard" data-v="legends"/);
assert.match(html, /data-goat-metric/);
assert.doesNotMatch(html, /data-goat-q/, 'the closed legends catalogue needs no search box');
assert.doesNotMatch(html, /data-goat-metric[^>]* disabled/, 'the metric selector works on legends');
assert.match(html, /Ya superas su marca/, 'the active career is compared with the legends');
assert.doesNotMatch(html, /data-a="goatsubmit"/, 'the legends board does not offer publishing');

/* El orden cambia con la métrica y con el modo. */
const change = env.listeners.change[0];
change({target: {matches: (sel) => sel === '[data-goat-metric]', value: 'goals'}});
assert.equal(env.UIX.getSheet().metric, 'goals');
env.UIX.actions.goatmode(null, 'manager');
assert.equal(env.UIX.getSheet().metric, 'wins', 'a player-only metric resets when switching mode');
const managerHtml = env.UIX.sheets.goat(env.UIX.getSheet());
assert.match(managerHtml, /Nerea Cano/);
assert.doesNotMatch(managerHtml, /Alba Fuentes/, 'manager mode lists manager legends only');
change({target: {matches: (sel) => sel === '[data-goat-metric]', value: 'trophies'}});
const byTrophies = env.UIX.sheets.goat(env.UIX.getSheet());
assert.match(byTrophies, /9 títulos/, 'the metric drives the ranking');
assert.ok(byTrophies.indexOf('Inês Ferreira') < byTrophies.indexOf('Nerea Cano') ||
  byTrophies.indexOf('Inês Ferreira') < byTrophies.indexOf('Giovanni Rizzo'), 'legends are ranked by the chosen metric');

/* Sin conexión ni servicio configurado, las leyendas siguen disponibles. */
const offline = buildUI({available: false, career: null});
offline.UIX.actions.goatlegends();
const offlineHtml = offline.UIX.sheets.goat(offline.UIX.getSheet());
assert.match(offlineHtml, /Ainhoa Prieto/);
assert.match(offlineHtml, /Personajes ficticios/);
assert.equal(offline.calls.list + offline.calls.listCareers, 0, 'the legends board never needs the network');

/* Sin el módulo de leyendas la ficha sigue funcionando y no muestra la pestaña. */
const bare = buildUI({legends: false});
bare.UIX.actions.goat();
assert.match(bare.UIX.sheets.goat(bare.UIX.getSheet()), /data-v="achievements"/);
assert.doesNotMatch(bare.UIX.sheets.goat(bare.UIX.getSheet()), /data-v="legends"/);

/* Gancho de la ficha de carrera: legado del club y acceso directo. */
const hook = env.UIX.hk.retGoat();
assert.match(hook, /Legado del club: Ainhoa Prieto/);
assert.match(hook, /data-a="goatlegends"/);
const other = buildUI({career: {game_mode: 'player', current_club: 'Millonarios', metrics: {goals: 3}, history: []}});
assert.doesNotMatch(other.UIX.hk.retGoat(), /Legado del club/);

/* ---------- 4. Integración con el juego ---------- */
for (const file of ['legacy-game/src/engine-player.js', 'legacy-game/src/engine-manager.js']) {
  const source = fs.readFileSync(file, 'utf8');
  assert.ok(source.includes('GoatLegends.careerNews'), `${file} announces legend records`);
  assert.ok(source.includes('flags: p.flags') || source.includes('flags: m.flags'), `${file} stores the announcement flag`);
}
const eraSheet = fs.readFileSync('legacy-game/src/ui-eras-legends.js', 'utf8');
assert.ok(eraSheet.includes('GoatLegends.forEra'), 'the Era yearbook cites the legends of that decade');
const eraCopy = JSON.parse(fs.readFileSync('legacy-game/erascene/translations.json', 'utf8'));
for (const key of ['Leyendas del universo en {year}',
  'Figuras ficticias del mismo universo que tu carrera; sus marcas no son récords históricos.']) {
  assert.ok(eraCopy[key], 'the Era yearbook copy is registered');
  for (const lang of ['en', 'de', 'it', 'fr']) assert.ok(eraCopy[key][lang], `${lang} has the Era legends copy`);
}
const build = fs.readFileSync('build_legacy_game.py', 'utf8');
assert.ok(build.indexOf('"goat.js"') < build.indexOf('"goat-legends.js"'), 'the legends load after the GOAT client');
assert.ok(build.indexOf('"goat-legends.js"') < build.indexOf('"ui-goat.js"'), 'the legends load before the GOAT sheet');
assert.equal(fs.readFileSync('legacy-game/src/goat-legends.js', 'utf8'), fs.readFileSync('src/goat-legends.js', 'utf8'), 'both source copies stay in sync');

console.log('GOAT legends tests passed: fourteen fictional in-universe legends, five locales, club/era provenance, record comparison, one-off career news and an offline legends board.');
