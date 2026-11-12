const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('legacy-game/src/season-viva.js', 'utf8');
function contextFor(save) {
  const ctx = {
    S: save,
    LANG: 'es',
    tr(text, vars = {}) { return String(text).replace(/\{(\w+)\}/g, (_, k) => vars[k] == null ? `{${k}}` : vars[k]); },
    trn(n, singular, plural, vars = {}) { return ctx.tr(n === 1 ? singular : plural, {...vars, n}); },
    seasonLabel: (year) => String(year),
    fmtDec: (n) => Number(n).toFixed(1).replace('.', ','),
    ord: (n) => `${n}º`,
    nextLgOpp: () => 2,
    clubName: (id) => `Club ${id}`,
    lgName: (id) => `Liga ${id}`,
    mUnavXI: () => ctx.unavailable || [],
    baseFeed(card) { ctx.S.feed.unshift({...card, id: (ctx.S.fid = (ctx.S.fid || 0) + 1)}); },
  };
  ctx.feed = function (card) {
    const result = ctx.baseFeed(card);
    ctx.SeasonViva.onFeed(card, (story) => ctx.baseFeed(story));
    return result;
  };
  vm.createContext(ctx);
  vm.runInContext(source, ctx, {filename: 'season-viva.js'});
  return ctx;
}

const manager = contextFor({mode: 'mgr', yr: 2026, ph: 'gap', m: {club: 1}, cl: [0, 0], pend: [], feed: []});
manager.feed({t: 'mblock', y: 2026, bi: 0, pos: 4, st: {w: 2, d: 1, l: 1}});
assert.equal(manager.S.feed.filter((x) => x.t === 'moment').length, 0, 'No story should be emitted for the opening block.');
manager.feed({t: 'mblock', y: 2026, bi: 1, pos: 3, st: {w: 3, d: 1, l: 0}});
assert.equal(manager.S.feed.filter((x) => x.t === 'moment').length, 1, 'The midpoint should add a career story.');
manager.feed({t: 'mblock', y: 2026, bi: 1, pos: 3, st: {w: 3, d: 1, l: 0}});
assert.equal(manager.S.feed.filter((x) => x.t === 'moment').length, 1, 'Replaying the same block key must not duplicate the story.');
manager.feed({t: 'mblock', y: 2026, bi: 3, pos: 2, st: {w: 2, d: 2, l: 0}});
manager.feed({t: 'mseasonEnd', y: 2026, pos: 2, row: {w: 10, d: 5, l: 3, tro: ['Cup']}});
assert.equal(manager.S.feed.filter((x) => x.t === 'moment').length, 3, 'Two stage stories and a season recap should be emitted.');
assert.match(manager.S.feed.find((x) => x.title === 'La temporada en tres momentos').txt, /puesto 2º/);
manager.feed({t: 'mseasonEnd', y: 2026, pos: 2, row: {w: 10, d: 5, l: 3, tro: ['Cup']}});
assert.equal(manager.S.feed.filter((x) => x.t === 'moment').length, 3, 'The season recap must be idempotent.');
manager.feed({t: 'mblock', y: 2027, bi: 1, pos: 5, st: {w: 1, d: 1, l: 2}});
assert.equal(manager.S.viva.y, 2027, 'Story state should roll over to the new season.');
assert.deepEqual(JSON.parse(JSON.stringify(manager.S.viva.seen)), ['block-1']);

const player = contextFor({mode: 'p', yr: 2026, ph: 'gap', p: {club: 1}, cl: [0, 1], pend: [], feed: []});
player.feed({t: 'block', y: 2026, bi: 1, st: {apps: 3, rs: 21.6, rn: 3}, log: [{g: 2, a: 1}, {g: 0, a: 0}, {g: 0, a: 0}]});
assert.match(player.S.feed.find((x) => x.t === 'moment').txt, /3 partidos, 2 goles y 1 asist\./);
const playerFocus = player.SeasonViva.focus();
assert.equal(playerFocus.action, 'tab');
assert.equal(playerFocus.value, 'comp');
assert.equal(playerFocus.detail, 'Club 2 · Liga 1');

const managerFocus = manager.SeasonViva.focus();
assert.equal(managerFocus.action, 'vivafocus', 'Manager focus should jump to the existing weekly-preparation card.');
manager.unavailable = [{}, {}];
const injuryFocus = manager.SeasonViva.focus();
assert.match(injuryFocus.title, /2 bajas/);
assert.equal(injuryFocus.action, 'fixxi');

const oldSave = contextFor({mode: 'p', yr: 2026, ph: 'gap', p: {club: 1}, cl: [0, 1], pend: [], feed: []});
assert.equal(oldSave.SeasonViva.focus().value, 'comp', 'Old saves without a story registry remain usable.');
assert.equal(oldSave.S.viva, undefined, 'Reading a legacy save must not eagerly mutate it.');

console.log('Season Viva tests passed: deterministic story limits, season reset, career summaries, focus actions and legacy saves.');
