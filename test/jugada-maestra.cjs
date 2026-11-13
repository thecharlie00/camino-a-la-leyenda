const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('legacy-game/src/jugada-maestra.js', 'utf8'), ctx, {filename: 'jugada-maestra.js'});
const levels = JSON.parse(JSON.stringify(ctx.JugadaMaestra.levels()));
assert.equal(levels.length, 30, 'campaign has five chapters of six original scenarios');
assert.deepEqual(levels.map((x) => x.id), Array.from({length: 30}, (_, i) => `jm-${String(i + 1).padStart(2, '0')}`));
assert.deepEqual([...new Set(levels.map((x) => x.chapter))], [1, 2, 3, 4, 5]);
assert.ok(levels.every((x) => x.max >= 3 && x.max <= 5));
assert.equal(new Set(levels.map((x) => { const f = ctx.JugadaMaestra.level(x.id); return `${f.ball.join(',')}/${f.mates.map((m) => m.join(',')).join(';')}/${f.rivals.map((r) => r.join(',')).join(';')}`; })).size, 30, 'each challenge has its own authored formation');

function play(id, seed, inputs) {
  const state = ctx.JugadaMaestra.fresh(id, seed);
  const actions = inputs.map(([x, y]) => {
    const r = ctx.JugadaMaestra.resolve(state, x, y);
    return {ok: r.ok, msg: r.msg, shot: r.shot, completed: r.completed, scored: r.scored, turns: state.turn, ball: state.ball.slice()};
  });
  return {actions, result: ctx.JugadaMaestra.result(state)};
}
const inputs = [[39, 42], [59, 61], [94, 50]];
assert.deepEqual(play('jm-01', 7781, inputs), play('jm-01', 7781, inputs), 'same seed and gestures must reproduce the same move');
const state = ctx.JugadaMaestra.fresh('jm-04', 44);
const before = state.turn;
assert.equal(ctx.JugadaMaestra.resolve(state, 55, 18).ok, false, 'invalid destinations are rejected');
assert.equal(state.turn, before, 'invalid input does not consume an action');
const terminal = ctx.JugadaMaestra.fresh('jm-04', 1);
ctx.JugadaMaestra.resolve(terminal, 94, 50);
assert.equal(terminal.done, true, 'a shot resolves the sequence');
const after = JSON.stringify(terminal);
assert.equal(ctx.JugadaMaestra.resolve(terminal, 94, 50).ok, false, 'completed moves cannot be replayed');
assert.equal(JSON.stringify(terminal), after);
console.log('Jugada Maestra tests passed: deterministic gestures, 30 scenarios, five chapters, invalid inputs and terminal state.');
