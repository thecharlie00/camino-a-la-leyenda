import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const packFiles = readdirSync('legacy-game/erascene/packs').filter((name) => name.endsWith('.json')).sort();
const packs = packFiles.map((name) => readJson(`legacy-game/erascene/packs/${name}`));
const timeline = readJson('legacy-game/erascene/rules-timeline.json');
const translations = readJson('legacy-game/erascene/translations.json');
const decisions = readJson('legacy-game/erascene/decisions.json');
const clubsHistory = readJson('legacy-game/erascene/clubs-history.json');
const erasData = { packs, timeline, decisions, clubsHistory };
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
assert.match(erasUiSource, /UIX\.add\("modes"[\s\S]*?data-a="era-open"/, 'Era Mode must remain available in the existing mode selector');
assert.doesNotMatch(erasUiSource, /UIX\.add\("mainhome"/, 'Era Mode must no longer have a separate shortcut on the main menu');
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
  for (const key of ['winPoints', 'backPassBanned', 'transferWindows', 'maxSubs', 'var', 'goldenGoal', 'silverGoal', 'goalLineTech', 'awayGoals']) assert.ok(key in pack.rules, `${pack.id} missing rule ${key}`);
  assert.equal(pack.rules.varByCompetition, undefined, `${pack.id} must scope VAR in the timeline, not by competition name`);
}
assert.equal(decisions.schema, 2, 'the expanded historical decision catalogue must use schema 2');
assert.equal(decisions.records.length, 1000, 'the catalog must contain 600 original plus 400 historical scenarios');
assert.equal(new Set(decisions.records.map((record) => record.id)).size, 1000, 'decision IDs must be unique');
assert.equal(decisions.historyEvents.length, 40, 'historical scenarios must reference a set of real-event anchors');
assert.equal(decisions.records.filter((record) => record.historyEventId).length, 400, 'exactly 400 scenarios must be historical');
for (const decade of ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s']) {
  const records = decisions.records.filter((record) => record.decade === decade);
  const original = records.filter((record) => !record.historyEventId);
  const historical = records.filter((record) => record.historyEventId);
  assert.equal(original.length, 100, `${decade} must retain its 100 original scenarios`);
  assert.equal(historical.length, decade === '2010s' || decade === '2020s' ? 60 : 70, `${decade} must contain the expected historical scenarios`);
  assert.equal(new Set(original.map((record) => `${record.topic}:${record.context}`)).size, 100, `${decade} original combinations must stay distinct`);
  for (const record of historical) {
    const event = decisions.historyEvents.find((candidate) => candidate.id === record.historyEventId);
    assert.ok(event, `${record.id} must reference a known historical event`);
    assert.equal(event.decade, record.decade, `${record.id} may only reference an event from its own decade`);
    assert.ok(event.year >= Number(decade.slice(0, 4)) && event.year <= Number(decade.slice(0, 4)) + 9, `${record.id} event year must fit its decade`);
  }
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
runInNewContext(readFileSync('legacy-game/src/achieve.js', 'utf8'), context, {filename: 'achieve.js'});
for (const pack of packs) {
  context.S = {yr: pack.years[0], uid: `queue-${pack.id}`, era: {active: true, decisionYears: {}, decisionSeen: {}}, pend: []};
  const queued = context.eraQueueSeasonDecision();
  assert.ok(queued, `${pack.id} should queue a season decision`);
  assert.equal(queued.decade, pack.id, `the ${pack.id} runtime queue must not leak another decade's decision`);
  if (queued.historyEventId) {
    const anchor = decisions.historyEvents.find((event) => event.id === queued.historyEventId);
    assert.equal(anchor.decade, pack.id, `the ${pack.id} queue must preserve the historical event decade`);
    assert.ok(anchor.year <= pack.years[0], `the ${pack.id} queue must not show a historical event before it happened`);
  }
}
const historicalRecord = decisions.records.find((record) => record.historyEventId);
const historicalEvent = decisions.historyEvents.find((event) => event.id === historicalRecord.historyEventId);
context.S = {yr: historicalEvent.year, era: {active: true}, p: {}};
for (const language of ['es', 'en', 'de', 'it', 'fr']) {
  context.LANG = language;
  const historicalDescription = context.eraDecisionDescription({id: historicalRecord.id}, false);
  assert.ok(historicalDescription.text.includes(historicalEvent.fact[language]), `historical decisions must show their factual frame in ${language}`);
  assert.ok(historicalDescription.title.includes(historicalEvent.label[language]), `historical decision titles must be localized in ${language}`);
}
context.LANG = 'es';
const spanishHistoricalDescription = context.eraDecisionDescription({id: historicalRecord.id}, false);
assert.ok(spanishHistoricalDescription.text.includes('sirve solo de contexto'), 'the UI must distinguish factual history from fictional game dilemmas');
const decadeStart = Number(historicalRecord.decade.slice(0, 4));
if (historicalEvent.year > decadeStart) {
  context.S.yr = historicalEvent.year - 1;
  assert.equal(context.eraDecisionDescription({id: historicalRecord.id}, false), null, 'a historical decision must not appear before its event happens');
}
context.S.yr = decadeStart + 10;
assert.equal(context.eraDecisionDescription({id: historicalRecord.id}, false), null, 'a historical decision must not be displayed outside its own decade');
const eraAchievementIds = context.ACH_ERA.map((achievement) => achievement[0]);
assert.equal(eraAchievementIds.length, 50, 'Era Mode must define exactly 50 exclusive achievements');
assert.equal(new Set(eraAchievementIds).size, 50, 'Era achievement IDs must be unique');
assert.ok(context.ACH_ERA.every((achievement) => typeof achievement[4] === 'function'), 'Each Era achievement must have an unlock condition');
context.S = {mode: 'p', yr: 1992, p: {seasons: []}};
assert.equal(context.achList().filter((achievement) => achievement[0].startsWith('era_')).length, 0,
  'Modern careers must not be offered Era achievements for unlocking');
context.S = {mode: 'p', yr: 1992, era: {active: true, startYear: 1992, decisionLog: []}, p: {seasons: []}};
assert.equal(context.achList().filter((achievement) => achievement[0].startsWith('era_')).length, 34,
  'Era player careers can unlock shared and player-only achievements');
assert.equal(context.achList(true).filter((achievement) => achievement[0].startsWith('era_')).length, 50,
  'the Era achievements screen must display all 50 player and manager challenges');
context.S = {mode: 'mgr', yr: 1992, era: {active: true, startYear: 1992, decisionLog: []}, m: {seasons: []}};
assert.equal(context.achList().filter((achievement) => achievement[0].startsWith('era_')).length, 34,
  'Era manager careers can unlock shared and manager-only achievements');
assert.equal(context.achList(true).filter((achievement) => achievement[0].startsWith('era_')).length, 50,
  'the Era achievements screen must display all 50 challenges in either career type');
context.S = {mode: 'p', yr: 1992, era: {active: true, startYear: 1992, decisionLog: []}, p: {seasons: []}};
const firstEraDecision = context.ACH_ERA.find((achievement) => achievement[0] === 'era_first_decision');
assert.equal(firstEraDecision[4](), false, 'Era achievements remain locked until their gameplay condition is met');
context.S.era.decisionLog.push({id: 'test-decision', year: 1992, choice: 0});
assert.equal(firstEraDecision[4](), true, 'resolving an Era decision unlocks the associated achievement condition');
context.careerTotals = () => ({apps: 0, g: 0, a: 0, cs: 0, seasons: 0});
const playerAchievementState = (era) => ({mode: 'p', yr: 1992, bi: 0, ach: {}, era,
  p: {seasons: [], ss: {apps: 0, g: 0, a: 0, cs: 0}, trophies: [], awards: [], intl: {caps: 0},
    peak: 60, ovr: 60, money: 0, flags: {}}});
context.S = playerAchievementState(undefined);
context.achCheck();
assert.equal(context.S.ach.era_start90s, undefined, 'a modern save cannot unlock an Era-only achievement');
context.S = playerAchievementState({active: true, startYear: 1992, startDecade: '1990s',
  decisionLog: [{id: 'test-decision', year: 1992, choice: 0}]});
context.achCheck();
assert.equal(context.S.ach.era_start90s, 1992, 'starting an Era career can unlock its decade achievement');
assert.equal(context.S.ach.era_first_decision, 1992, 'Era achievements are saved in the active Era career');

/* timeline v2: cada regla tiene alcance (global, liga, competición o confederación) y fuente */
assert.equal(timeline.schema, 2, 'the rules timeline must use schema 2 with scopes');
for (const event of timeline.events) {
  assert.ok(event.scope && ['global', 'league', 'competition', 'confederation'].includes(event.scope.type), `${event.id} needs a scope`);
  if (event.changes.rules) assert.ok(/^https?:\/\//.test(event.source || ''), `${event.id} must cite a source`);
}
const pointsFor = (year, scope) => {
  context.S = {yr: year, era: {active: true}};
  const row = [0, 0, 0, 0, 0, 0, 0];
  context.eraWithScope(scope, () => context.tblAdd(row, 2, 1));
  return row[6];
};
for (const [year, scope, points, why] of [
  [1980, {league: 'ENG1'}, 2, 'England still gave two points in 1980-81'],
  [1981, {league: 'ENG1'}, 3, 'England adopted three points in 1981-82'],
  [1981, {league: 'ENG3'}, 3, 'the English lower divisions follow the same rule'],
  [1981, {league: 'ESP1'}, 2, 'Spain did not adopt three points until 1995-96'],
  [1994, {league: 'ESP1'}, 2, 'Spain still gave two points in 1994-95'],
  [1994, {league: 'ITA1'}, 3, 'Italy adopted three points in 1994-95'],
  [1994, {comp: 'WC', year: 1994}, 3, 'the 1994 World Cup used three points'],
  [1990, {comp: 'WC', year: 1990}, 2, 'the 1990 World Cup used two points'],
  [1995, {league: 'ESP1'}, 3, 'Spain adopted three points in 1995-96'],
  [1995, {league: 'GER1'}, 3, 'Germany adopted three points in 1995-96'],
  [1992, null, 2, 'no global three-point rule before FIFA adopted it in 1995']]) assert.equal(pointsFor(year, scope), points, why);
assert.equal(context.eraRulesForYear(1991).backPassBanned, false);
assert.equal(context.eraRulesForYear(1992).backPassBanned, true);
assert.equal(context.eraRulesForYear(1993, {league: 'ENG1'}).goldenGoal, false, 'golden goal was never a league rule');
assert.equal(context.eraRulesForYear(1996, {comp: 'EURO', year: 1996}).goldenGoal, true, 'Euro 96 used the golden goal');
assert.equal(context.eraRulesForYear(2004, {comp: 'EURO', year: 2004}).goldenGoal, false, 'Euro 2004 replaced it with the silver goal');
assert.equal(context.eraRulesForYear(2004, {comp: 'EURO', year: 2004}).silverGoal, true, 'Euro 2004 used the silver goal');
assert.equal(context.eraRulesForYear(2008, {comp: 'EURO', year: 2008}).silverGoal, false, 'the silver goal ended after Euro 2004');
assert.equal(context.eraRulesForYear(2015, {league: 'ESP1'}).goalLineTech, false, 'LaLiga never adopted goal-line technology');
assert.equal(context.eraRulesForYear(2013, {league: 'ENG1'}).goalLineTech, true, 'the Premier League adopted goal-line technology in 2013-14');
assert.equal(context.eraRulesForYear(2017, {league: 'GER1'}).var, true, 'the Bundesliga adopted VAR in 2017-18');
for (const [year, pattern] of [[1974, 'retro'], [1984, 'chevron'], [1995, 'hoops'], [2005, 'split'], [2015, 'diamond'], [2025, 'lightning']]) {
  context.S = {yr: year, era: {active: true}};
  assert.equal(context.PLook.rig({gear: {}}).shirtPattern, pattern, `the ${year}s kit should receive its procedural period pattern`);
}
assert.equal(context.PLook.rig({gear: {shirt: {id: 'equipped-shirt'}}}).shirtPattern, 'plain', 'an equipped stat-bearing shirt must override the era-generated pattern');
assert.equal(context.PLook.rig({gear: {}, shirt: {id: 'stripes', pattern: 'stripes'}}).shirtPattern, 'stripes', 'a user-selected look shirt and its stat source must be respected');
context.S = {yr: 2026};
assert.equal(context.PLook.rig({gear: {}}).shirtPattern, 'plain', 'modern player clothing must not receive an era pattern');
context.S = {yr: 1996, era: {active: true}};
assert.deepEqual(Array.from(context.extraTime()), [3, 1], 'outside a golden-goal competition extra time is played in full');
assert.deepEqual(Array.from(context.eraWithScope({comp: 'EURO', year: 1996}, () => context.extraTime())), [1, 0], 'golden goal ends extra time after a winning goal at Euro 96');
assert.deepEqual(Array.from(context.eraWithScope({league: 'ENG1'}, () => context.extraTime())), [3, 1], 'a league cup tie in 1996 has no golden goal');
context.S.yr = 2005;
assert.deepEqual(Array.from(context.eraWithScope({comp: 'EURO', year: 2008}, () => context.extraTime())), [3, 1], 'golden goal is gone after 2004');
assert.equal(context.eraRulesForYear(1994).maxSubs, 2);
assert.equal(context.eraRulesForYear(1994).goalkeeperSub, true, '1994-95 allowed two substitutes plus a goalkeeper');
assert.equal(context.eraRulesForYear(1995).maxSubs, 3);
assert.equal(context.eraRulesForYear(2001).transferWindows, false);
assert.equal(context.eraRulesForYear(2002).transferWindows, true);
assert.equal(context.eraRulesForYear(2017, {league: 'ENG1'}).var, false);
assert.equal(context.eraRulesForYear(2018, {league: 'ESP1'}).var, true);
assert.equal(context.eraRulesForYear(2018, {league: 'ENG1'}).var, false);
assert.equal(context.eraRulesForYear(2019, {league: 'ENG1'}).var, true);
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
assert.ok(managerDecisionDesc.text.includes('situación ficticia') || managerDecisionDesc.text.includes('son ficticios'), 'decisions must distinguish fictional dilemmas from historical context');
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


/* historia de clubes y ligas: existencia y nombres de época */
assert.equal(context.eraClubExists('RB Leipzig', 2008), false, 'RB Leipzig did not exist before 2009');
assert.equal(context.eraClubExists('RB Leipzig', 2009), true);
assert.equal(context.eraClubExists('Real Madrid', 1970), true, 'a club without history data exists with its current name');
assert.equal(context.eraClubName('New York Red Bulls', 2000), 'NY/NJ MetroStars');
assert.equal(context.eraClubName('Red Bull Salzburgo', 1990), 'Austria Salzburgo');
assert.equal(context.eraClubName('Red Bull Salzburgo', 2005), 'Red Bull Salzburgo');
assert.equal(context.eraLeagueName('ENG1', 'Premier League', 1975), 'Football League First Division', 'the English top flight was the First Division in 1975');
assert.equal(context.eraLeagueName('ENG1', 'Premier League', 1992), 'Premier League');
assert.equal(context.eraLeagueExists('MLS', 1990), false, 'MLS began in 1996');
assert.equal(context.eraLeagueExists('MLS', 1996), true);
for (const [name, entry] of Object.entries(clubsHistory.clubs)) assert.ok(entry.src, `${name} needs a source or 'memory'`);
const decisionText = JSON.stringify(decisions);
for (const realName of ['Paolo Rossi', 'Michel Platini', 'Diego Maradona', 'David Trezeguet']) assert.ok(!decisionText.includes(realName), `historical decisions must use a versioned name instead of ${realName}`);
console.log('Era packs, 1,000 playable decisions (400 historical and decade-locked), 50 Era-only achievements, web home/selector visibility, Era rules, kits and isolated saves passed.');
