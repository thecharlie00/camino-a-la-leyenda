import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const packFiles = readdirSync('legacy-game/erascene/packs').filter((name) => name.endsWith('.json')).sort();
const packs = packFiles.map((name) => readJson(`legacy-game/erascene/packs/${name}`));
const timeline = readJson('legacy-game/erascene/rules-timeline.json');
const translations = readJson('legacy-game/erascene/translations.json');
const decisions = readJson('legacy-game/erascene/decisions.json');
const erasData = { packs, timeline, decisions };
const gameDataSource = readFileSync('legacy-game/src/data.js', 'utf8');
const availableClubNames = new Set([...gameDataSource.matchAll(/clubs:\"([^\"]+)\"/g)].flatMap((match) => match[1].split('|')));
const uiSource = readFileSync('legacy-game/src/ui.js', 'utf8');
const erasUiSource = readFileSync('legacy-game/src/ui-eras.js', 'utf8');
const gameCss = readFileSync('legacy-game/src/style.css', 'utf8');
assert.match(uiSource, /if \(!S \|\| \(S\.era && S\.era\.active\)\) return Promise\.resolve\(\)/, 'Modern Store.flush must ignore Era Mode saves');
assert.match(erasUiSource, /store\.flush\(\)[\s\S]*?flushed\.then\(begin\)/, 'The modern save must flush before replacing S with an era career');
assert.match(erasUiSource, /flushed\.then\(applyLoad\)/, 'The modern save must flush before an era save replaces S');
assert.match(erasUiSource, /function recentDecisions\(\)[\s\S]*?S\.era\.decisionLog/, 'the era ledger must surface recorded decisions in the existing rules view');
assert.match(uiSource, /s \+= slot\("modes"\)/, 'The mode selection screen must render its extensible mode slot');
assert.match(erasUiSource, /UIX\.add\("modes"[\s\S]*?data-a="era-open"/, 'Era Mode must be offered in the Play > Choose a mode menu');
assert.doesNotMatch(erasUiSource, /rules\.backPassBanned/, 'the setup must not claim that an unimplemented back-pass rule affects play');
assert.match(erasUiSource, /no simulan una red de contactos/, 'media channels must be described as HUD context, not a functional contact network');
assert.match(erasUiSource, /UIX\.actions\["era-open"\]/, 'The Era Mode option must open its existing setup flow');
assert.match(erasUiSource, /layer\.setAttribute\("data-era-decade", pack\.id\)/, 'Era screens must expose the selected decade to their visual theme');
assert.match(erasUiSource, /app\.setAttribute\("data-era-decade", eraPackForYear\(S\.yr\)\.id\)/, 'The shared game interface must track the active Era decade');
for (const decade of ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s']) {
  assert.ok(gameCss.includes(`data-era-decade="${decade}"`), `the art direction must define a visual treatment for ${decade}`);
}
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
assert.equal(decisions.records.length, 600, 'the catalog must contain 100 scenarios per decade');
assert.equal(new Set(decisions.records.map((record) => record.id)).size, 600, 'decision IDs must be unique');
for (const decade of ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s']) {
  const records = decisions.records.filter((record) => record.decade === decade);
  assert.equal(records.length, 100, `${decade} must have 100 scenarios`);
  assert.equal(new Set(records.map((record) => `${record.topic}:${record.context}`)).size, 100, `${decade} must have distinct combinations`);
}
for (const phrase of [...Object.values(decisions.contexts).flat(), ...decisions.topics.map((topic) => topic.key), ...Object.values(decisions.periods)]) assert.ok(translations[phrase], `Missing translated decision phrase ${phrase}`);
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
  window: {UIX: {toast: () => {}, persist: () => {}, render: () => {}, ui: () => ({})}, mgrStartSeason() { context.S.m.mk = {open: 'verano', list: [], tx: []}; }, mgrStartBlock() {}, mgrQueueBetween() {}, mgrStartSummer() {}, queueBetween() {}, mgrScoutList(count) { context.lastScoutCount = count; return [{name: 'Generated scout target', pot: 80, ovr: 65, potR: [76, 84]}]; }, growthTick() { context.S.p.ovr += 10; context.S.p.tr.TEC = (context.S.p.tr.TEC || 0) + 10; }, mgrGrowth() { context.S.m.sq[0].ovr += 10; }},
  EX_PEND: {}, MPH: {},
  PLook: {rig: (player) => ({shirtPattern: player?.shirt?.pattern || player?.shirt?.id || 'plain', shirt: '#112233', trim: '#eeeeee'}), player: () => ({gear: {}})},
  mgrPendValid: () => false, mgrDesc: () => null, mgrResolve: () => null,
  mgrScoutList: () => [{name: 'Generated scout target', pot: 80, ovr: 65, potR: [76, 84]}],
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
  clamp: (value, low, high) => Math.max(low, Math.min(high, value)),
  feed: (card) => { context.lastFeed = card; },
  hashStr: (text) => [...String(text)].reduce((n, ch) => n + ch.charCodeAt(0), 0),
  clubName: (id) => id >= 0 ? 'Manchester United' : '—',
  buildWorld() { context.W.clubs = [{n: 'Manchester United'}, {n: 'Arsenal'}]; context.W.cName = {'Manchester United': 0, Arsenal: 1}; },
  serialize: () => JSON.stringify(context.S),
  newCareer(options) { context.S = {yr: context.START_YEAR, p: {fn: options.fn, ln: options.ln, club: 0, money: 100000, sal: 50000, mor: 60, fit: 60, prof: 50, fame: 20, fans: 20, ovr: 60, tr: {}, peak: 60}, cr: [], cl: [], pend: [], mode: 'p'}; return context.S; },
  newManagerCareer(options) { context.lastManagerOptions = options; context.S = {yr: context.START_YEAR, m: {fn: options.fn, ln: options.ln, club: options.club, bud: 2000000, rep: 60, board: 60, peakRep: 60, chem: 60, fans: 50, sq: [{mor: 60, fit: 60}]}, cr: [], cl: [], pend: [], mode: 'mgr'}; return context.S; },
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
for (const [year, pattern] of [[1974, 'retro'], [1984, 'chevron'], [1995, 'hoops'], [2005, 'split'], [2015, 'diamond'], [2025, 'lightning']]) {
  context.S = {yr: year, era: {active: true}};
  assert.equal(context.PLook.rig({gear: {}}).shirtPattern, pattern, `the ${year}s kit should receive its procedural period pattern`);
}
assert.equal(context.PLook.rig({gear: {shirt: {id: 'equipped-shirt'}}}).shirtPattern, 'plain', 'an equipped stat-bearing shirt must override the era-generated pattern');
assert.equal(context.PLook.rig({gear: {}, shirt: {id: 'stripes', pattern: 'stripes'}}).shirtPattern, 'stripes', 'a user-selected look shirt and its stat source must be respected');
context.S = {yr: 2026};
assert.equal(context.PLook.rig({gear: {}}).shirtPattern, 'plain', 'modern player clothing must not receive an era pattern');
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
assert.equal(context.S.pend[0]?.k, 'eraDecision', 'a new era career should receive a meaningful decision in its first season');
const managerDecision = context.S.pend[0];
const managerDecisionDesc = context.mgrDesc(managerDecision);
assert.equal(managerDecisionDesc.opts.length, 3, 'manager era decisions should expose three actionable strategies');
assert.ok(managerDecisionDesc.text.includes('situación ficticia'), 'decisions must not be passed off as documented historical episodes');
const managerBudgetBeforeDecision = context.S.m.bud;
context.mgrResolve(0);
assert.equal(context.S.era.decisionLog.length, 1, 'the resolved manager decision should be recorded in the isolated era save');
assert.notEqual(context.S.m.bud, managerBudgetBeforeDecision, 'a manager decision should have an immediate, observable resource effect');
assert.equal(context.lastFeed?.eraDecisionId, managerDecision.id);
assert.equal(context.EraStore.save(), true);
const scoutingRecord = decisions.records.find((record) => record.decade === '1990s' && record.topic === 0 && record.context === 0);
context.S.pend = [{k: 'eraDecision', id: scoutingRecord.id}];
context.eraResolveDecision({id: scoutingRecord.id}, 0, true);
assert.ok(context.S.era.scoutingLevel > 0, 'scouting decisions should improve persistent information capacity');
const scoutedTargets = context.window.mgrScoutList(2);
assert.equal(context.lastScoutCount, 2 + context.S.era.scoutingLevel, 'scouting capacity should increase the actual candidate list');
assert.ok(scoutedTargets[0].potR[1] - scoutedTargets[0].potR[0] < 8, 'scouting should narrow uncertainty for generated targets');
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

context.eraStartCareer('player', 1995, {firstName: 'Alex', lastName: 'Example'});
assert.equal(context.S.pend[0]?.k, 'eraDecision');
const playerDecision = context.S.pend[0];
assert.equal(context.EX_PEND.eraDecision.desc(playerDecision).opts.length, 3);
const playerDecisionRecord = context.eraDecisionRecord(playerDecision.id);
const playerTrainingBefore = context.S.era.trainingBonus || 0;
context.eraResolveDecision({id: playerDecisionRecord.id}, 0, false);
if (decisions.topics[playerDecisionRecord.topic].lever === 'training') assert.ok(context.S.era.trainingBonus > playerTrainingBefore, 'a training choice should improve future growth');
assert.equal(context.S.era.decisionLog.length, 1);
const trainingRecord = decisions.records.find((record) => record.decade === '1990s' && record.topic === 1 && record.context === 0);
context.S.pend = [{k: 'eraDecision', id: trainingRecord.id}];
context.eraResolveDecision({id: trainingRecord.id}, 0, false);
const growthBeforeDecision = context.S.p.ovr;
context.window.growthTick();
assert.ok(context.S.p.ovr - growthBeforeDecision > 9.1, 'the era decision training bonus must feed into actual future player growth');
assert.equal(memory.get('camino.slots'), '["modern-slot"]', 'player-era decisions must not alter the modern save index');

console.log('Era packs, year-by-year rules, 600-decision catalog, playable choices, procedural 3D kits, modern-mode isolation and independent saves passed.');
