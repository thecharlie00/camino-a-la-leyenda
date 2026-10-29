import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const packFiles = readdirSync('legacy-game/erascene/packs').filter((name) => name.endsWith('.json')).sort();
const packs = packFiles.map((name) => readJson(`legacy-game/erascene/packs/${name}`));
const timeline = readJson('legacy-game/erascene/rules-timeline.json');
const translations = readJson('legacy-game/erascene/translations.json');
const erasData = { packs, timeline };
const gameDataSource = readFileSync('legacy-game/src/data.js', 'utf8');
const availableClubNames = new Set([...gameDataSource.matchAll(/clubs:\"([^\"]+)\"/g)].flatMap((match) => match[1].split('|')));
const uiSource = readFileSync('legacy-game/src/ui.js', 'utf8');
const erasUiSource = readFileSync('legacy-game/src/ui-eras.js', 'utf8');
assert.match(uiSource, /if \(!S \|\| \(S\.era && S\.era\.active\)\) return Promise\.resolve\(\)/, 'Modern Store.flush must ignore Era Mode saves');
assert.match(erasUiSource, /store\.flush\(\)[\s\S]*?flushed\.then\(begin\)/, 'The modern save must flush before replacing S with an era career');
assert.match(erasUiSource, /flushed\.then\(applyLoad\)/, 'The modern save must flush before an era save replaces S');
assert.match(uiSource, /s \+= slot\("modes"\)/, 'The mode selection screen must render its extensible mode slot');
assert.match(erasUiSource, /UIX\.add\("modes"[\s\S]*?data-a="era-open"/, 'Era Mode must be offered in the Play > Choose a mode menu');
assert.match(erasUiSource, /UIX\.actions\["era-open"\]/, 'The Era Mode option must open its existing setup flow');
assert.match(uiSource, /if \(S && S\.era && S\.era\.active\) \{ persist\(\); S = null;/, 'Retiring from Era Mode must return to its isolated home, not modern slot management');
assert.match(uiSource, /function eraSocialAvailable\(\)/, 'Era Mode must gate social-media navigation by the current year');

assert.deepEqual(packs.map((pack) => pack.id), ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s']);
for (const pack of packs) {
  assert.equal(pack.schema, 1);
  assert.equal(pack.rosterMode, 'generated-archetypes');
  assert.equal(pack.years[1] - pack.years[0], 9);
  for (const club of pack.referenceClubs) assert.ok(availableClubNames.has(club), `${pack.id} references a club absent from the shared game database: ${club}`);
  for (const key of ['rules', 'media', 'economy', 'presentation', 'staff', 'playerModel', 'referenceClubs']) assert.ok(pack[key], `${pack.id} missing ${key}`);
  for (const key of ['winPoints', 'backPassBanned', 'transferWindows', 'maxSubs', 'varByCompetition']) assert.ok(key in pack.rules, `${pack.id} missing rule ${key}`);
}
for (const [key, locales] of Object.entries(translations)) {
  for (const language of ['en', 'de', 'it', 'fr']) assert.ok(locales[language], `Missing ${language} translation: ${key}`);
  const placeholders = (text) => [...text.matchAll(/\{[A-Za-z_]+\}/g)].map((match) => match[0]).sort();
  for (const language of ['en', 'de', 'it', 'fr']) assert.deepEqual(placeholders(locales[language]), placeholders(key), `Placeholder mismatch for ${language}: ${key}`);
}

const memory = new Map([['camino.slots', '["modern-slot"]']]);
const localStorage = {
  getItem: (key) => memory.has(key) ? memory.get(key) : null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key)
};
const context = {
  ERAS_MODE: true,
  ERAS_DATA: erasData,
  ERAS_I18N: translations,
  LANG: 'es',
  START_YEAR: 2026,
  S: {yr: 2026},
  W: {clubs: [{n: 'Manchester United'}], cName: {'Manchester United': 0}, lg: [{id: 'ENG1'}, {id: 'ESP1'}]},
  localStorage,
  window: {UIX: {toast: () => {}, persist: () => {}, render: () => {}, ui: () => ({})}, mgrStartSeason() { context.S.m.mk = {open: 'verano', list: [], tx: []}; }, mgrStartBlock() {}, mgrQueueBetween() {}, mgrStartSummer() {}, queueBetween() {}, growthTick() { context.S.p.ovr += 10; context.S.p.tr.TEC = (context.S.p.tr.TEC || 0) + 10; }, mgrGrowth() { context.S.m.sq[0].ovr += 10; }},
  mgrScoutList: () => [{name: 'Generated scout target'}],
  genOffers: () => [{club: 1}],
  N_: (text) => text,
  Date,
  Math,
  JSON,
  Object,
  Array,
  String,
  Number,
  console: {warn: () => {}, error: () => {}, log: () => {}},
  hashStr: (text) => [...String(text)].reduce((n, ch) => n + ch.charCodeAt(0), 0),
  clubName: (id) => id >= 0 ? 'Manchester United' : '—',
  buildWorld() { context.W.clubs = [{n: 'Manchester United'}, {n: 'Arsenal'}]; context.W.cName = {'Manchester United': 0, Arsenal: 1}; },
  serialize: () => JSON.stringify(context.S),
  newCareer(options) { context.S = {yr: context.START_YEAR, p: {fn: options.fn, ln: options.ln, club: 0}, cr: [], cl: [], mode: 'p'}; return context.S; },
  newManagerCareer(options) { context.lastManagerOptions = options; context.S = {yr: context.START_YEAR, m: {fn: options.fn, ln: options.ln, club: options.club}, cr: [], cl: [], mode: 'mgr'}; return context.S; },
  tblAdd(row, gf, ga) { row[0]++; row[4] += gf; row[5] += ga; if (gf > ga) { row[1]++; row[6] += 3; } else if (gf === ga) { row[2]++; row[6]++; } else row[3]++; },
  salaryFor: () => 100000,
  marketValue: () => 100000,
  pValue: () => 100000,
  mgrSalary: () => 400000,
  mBudgetFor: () => 5000000,
  attrs: () => ({RIT: 80, VEL: 70, FIS: 80}),
  liveSub: () => true,
  extraTime: () => [3, 1],
  socPost: () => 'post',
  realDB: () => ({licensedData: true}),
  EVENT_BY_ID: {x_var_anulado: {when: () => true}},
  MEV_BY_ID: {mx_var: {when: () => true}},
  tr: (text) => text
};
runInNewContext(readFileSync('legacy-game/src/eras-core.js', 'utf8'), context, {filename: 'eras-core.js'});

for (const [year, points] of [[1979, 2], [1980, 2], [1981, 3], [1992, 3]]) {
  context.S = {yr: year, era: {active: true}};
  const row = [0, 0, 0, 0, 0, 0, 0];
  context.tblAdd(row, 2, 1);
  assert.equal(row[6], points, `wrong win points for ${year}`);
}
assert.equal(context.eraRulesForYear(1991).backPassBanned, false);
assert.equal(context.eraRulesForYear(1992).backPassBanned, true);
assert.equal(context.eraRulesForYear(1993).goldenGoal, true);
context.S = {yr: 1992, era: {active: true}};
assert.deepEqual(Array.from(context.extraTime()), [3, 1]);
context.S.yr = 1993;
assert.deepEqual(Array.from(context.extraTime()), [1, 0], 'golden goal ends extra time after a winning goal');
context.S.yr = 2004;
assert.deepEqual(Array.from(context.extraTime()), [3, 1], 'golden goal is removed from 2004');
assert.equal(context.eraRulesForYear(1994).maxSubs, 2);
assert.equal(context.eraRulesForYear(1995).maxSubs, 3);
assert.equal(context.eraRulesForYear(2001).transferWindows, false);
assert.equal(context.eraRulesForYear(2002).transferWindows, true);
assert.equal(context.eraRulesForYear(2017).varByCompetition['Premier League'], undefined);
assert.equal(context.eraRulesForYear(2018).varByCompetition['La Liga'], true);
assert.equal(context.eraRulesForYear(2018).varByCompetition['Premier League'], undefined);
assert.equal(context.eraRulesForYear(2019).varByCompetition['Premier League'], true);
context.S = {yr: 2018, era: {active: true}, p: {club: 0}, cl: [0]};
assert.equal(context.EVENT_BY_ID.x_var_anulado.when({inSeason: true}), false, 'VAR is not available in the Premier League during 2018');
context.W.lg[0].id = 'ESP1';
assert.equal(context.EVENT_BY_ID.x_var_anulado.when({inSeason: true}), true, 'VAR is available in La Liga during 2018');
context.W.lg[0].id = 'ENG1';
context.S.yr = 2019;
assert.equal(context.EVENT_BY_ID.x_var_anulado.when({inSeason: true}), true, 'VAR becomes available in the Premier League in 2019');
assert.equal(context.eraRulesForYear(2020).maxSubs, 5);
assert.equal(context.eraRulesForYear(2021).compressedCovidCalendar, true);
assert.equal(context.eraRulesForYear(2022).compressedCovidCalendar, false);
assert.equal(context.eraInfoForYear(2009).media.socialMedia, false, 'social media remains unavailable until 2010');
assert.equal(context.eraInfoForYear(2010).media.socialMedia, true, 'social media begins in the configured transition year');
context.S = {yr: 1992, era: {active: true}, m: {club: 0, mk: {open: '', list: []}}};
context.window.mgrStartSeason();
assert.equal(context.S.m.mk.open, 'year-round', 'eras without mandatory windows allow year-round transfers');
assert.equal(context.S.m.mk.list.length, 1);
context.S.yr = 2002;
context.S.m.mk.open = 'verano';
context.window.mgrStartBlock();
assert.equal(context.S.m.mk.open, 'verano', 'modern transfer windows remain the rule from 2002 onward');
context.S = {yr: 1992, era: {active: true}, p: {}, pend: []};
context.window.queueBetween(1);
assert.equal(context.S.pend[0]?.kind, 'mercado abierto', 'player careers can receive offers between windows before 2002');
context.S.yr = 2002;
context.S.pend = [];
context.window.queueBetween(1);
assert.equal(context.S.pend.length, 0, 'the year-round offer rule ends when transfer windows begin');

context.S = {yr: 1992, era: {active: true}};
assert.equal(context.socPost('goal', {}), null, 'social-media posts must not appear in 1992');
context.S.yr = 2009;
assert.equal(context.socPost('goal', {}), null, 'social-media posts must remain unavailable through 2009');
context.S.yr = 2010;
assert.equal(context.socPost('goal', {}), 'post', 'social-media posts become available in 2010');
context.S.yr = 1995;
assert.equal(context.liveSub(), true);
context.S.live = {subs: [{}, {}, {}]};
assert.equal(context.liveSub(), false, 'a fourth substitution must be blocked in 1995');
context.S = {yr: 1992, era: {active: true}};
assert.equal(context.attrs().RIT, Math.round(80 * 0.91));
assert.equal(context.marketValue(), 42000);
assert.equal(context.mgrSalary(), 48000);
assert.equal(context.mBudgetFor(), 1300000);
context.S = {yr: 1992, era: {active: true}, p: {ovr: 70, tr: {TEC: 0}}};
context.window.growthTick();
assert.equal(context.S.p.ovr, 79, 'training growth follows the era profile');
assert.equal(context.S.p.tr.TEC, 9);
context.S = {yr: 1992, era: {active: true}, m: {sq: [{ovr: 70}]}};
context.window.mgrGrowth();
assert.equal(context.S.m.sq[0].ovr, 79, 'manager squad growth follows the era profile');

context.S = {yr: 1992, era: {active: true}};
assert.equal(context.realDB(), null, 'Era Mode must not expose unlicensed historical player-name data');
context.S = {yr: 2026};
assert.equal(context.realDB().licensedData, true, 'the modern mode retains its existing data source');
const modernRow = [0, 0, 0, 0, 0, 0, 0];
context.tblAdd(modernRow, 1, 0);
assert.equal(modernRow[6], 3, 'modern points remain unchanged without S.era');
assert.equal(context.marketValue(), 100000, 'modern market values remain unchanged without S.era');
assert.equal(context.mgrSalary(), 400000, 'modern manager salaries remain unchanged without S.era');
assert.equal(context.mBudgetFor(), 5000000, 'modern budgets remain unchanged without S.era');

context.W.clubs = [{n: 'Arsenal'}, {n: 'Manchester United'}];
context.W.cName = {Arsenal: 0, 'Manchester United': 1};
context.eraStartCareer('manager', 1992, {firstName: 'Casey', lastName: 'Example', club: 0, clubName: 'Arsenal'});
assert.equal(context.lastManagerOptions.club, 1, 'club choice must survive a switch from a different world dataset');
assert.equal(context.START_YEAR, 2026, 'starting a historical career must not leave the modern year changed');
assert.equal(context.S.yr, 1992);
assert.equal(context.S.era.profileId, '1990s');
assert.equal(context.S.era.startYear, 1992);
assert.equal(context.EraStore.save(), true);
assert.equal(memory.get('camino.slots'), '["modern-slot"]', 'era saves must never modify the modern save index');
const saveKeys = [...memory.keys()].filter((key) => key.startsWith('camino.eras.v1.'));
assert.ok(saveKeys.length >= 2);
assert.ok(saveKeys.every((key) => key.startsWith('camino.eras.v1.')));
assert.ok(context.EraStore.read(context.S.uid));
const olderSave = JSON.stringify({era: {active: true, startDecade: '1990s', saveSchema: 1}});
const futureSave = JSON.stringify({era: {active: true, startDecade: '1990s', saveSchema: 2}});
memory.set('camino.eras.v1.save.older', olderSave);
memory.set('camino.eras.v1.save.future', futureSave);
assert.equal(context.EraStore.read('older'), olderSave, 'current builds accept same-schema era saves');
assert.equal(context.EraStore.read('future'), null, 'future era saves are rejected by older builds');
context.EraStore.remove(context.S.uid);
context.EraStore.remove('older');
context.EraStore.remove('future');
assert.equal(context.EraStore.getIndex().length, 0);
assert.equal(memory.get('camino.slots'), '["modern-slot"]');

console.log('Era packs, year-by-year rules, modern-mode isolation and independent forward-only saves passed.');
