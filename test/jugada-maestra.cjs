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

// Retos dibujados (sin azar): el trazo decide como en los juegos de jugadas dibujadas.
const J = ctx.JugadaMaestra;
function bend(a, b, off) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), c = [mx - dy / L * off, my + dx / L * off], out = []; for (let i = 1; i < 8; i++) { const t = i / 8; out.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]); } return out; }
{
  const s = J.fresh('jm-04', 9);                     // balón en [66,50], rivales en [69,43], [81,55], [87,44]
  const blocked = J.resolve(JSON.parse(JSON.stringify(s)), 96, 56.5, [[75, 52], [85, 55]], 1.5);
  assert.equal(blocked.how, 'block', 'a shot drawn through a defender is blocked');
  const curved = J.resolve(JSON.parse(JSON.stringify(s)), 96, 43, bend([66, 50], [96, 43], 8), 2.0);
  assert.equal(curved.how, 'goal', 'a shot curved around the defenders into the corner scores');
  const centre = J.resolve(JSON.parse(JSON.stringify(s)), 96, 50, [[80, 50.2]], 1.0);
  assert.ok(['save', 'block'].includes(centre.how), 'a shot at the keeper does not score');
  const wide = J.resolve(JSON.parse(JSON.stringify(s)), 96, 43, bend([66, 50], [96, 43], 8), 3.0);
  assert.equal(wide.how, 'miss', 'a shot over the bar misses');
  const again = J.resolve(JSON.parse(JSON.stringify(s)), 96, 43, bend([66, 50], [96, 43], 8), 2.0);
  assert.equal(again.how, curved.how, 'campaign outcomes do not depend on luck');
  const far = J.fresh('jm-01', 3);                   // 40 m de la portería
  for (const y of [43, 57]) for (const off of [-15, 0, 15]) assert.notEqual(J.resolve(JSON.parse(JSON.stringify(far)), 96, y, bend(far.ball, [96, y], off), 2).how, 'goal', 'shots from 40 m never score');
  const pass = J.fresh('jm-01', 3), cut = J.fresh('jm-01', 3);
  const ok = J.resolve(pass, 59, 61, [[30, 60], [45, 64]]);
  assert.equal(ok.completed, true, 'a pass drawn around the defenders arrives');
  const bad = J.resolve(cut, 59, 61, [[34, 55], [52, 50]]);
  assert.equal(bad.completed, false, 'a pass drawn through a defender is cut');
  assert.equal(cut.done, true, 'a cut pass ends a drawn challenge');
  for (const l of J.levels()) { const p = J.par(l.id); assert.ok(p >= 1 && p <= l.max, `${l.id} can be solved within its actions`); }
}
console.log('Jugada Maestra drawn-play tests passed: blocks, curves, corners, misses, long shots, cut passes and par.');
