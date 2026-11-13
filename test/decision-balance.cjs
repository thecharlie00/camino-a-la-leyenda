/* Equilibrio de las decisiones nuevas: cuántas familias pertinentes existen por modo y
   género, cuántas aparecen realmente en dos temporadas con el ritmo del motor y qué
   queda pendiente. No basta con que el catálogo sea grande: hay que medir la exposición.
   node test/decision-balance.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const player = [], manager = [];
const ctx = {
  S: {tw: 5, custom: {id: 10}, m: {club: 10, flags: {}, sq: [{id: 3, age: 19, st: {apps: 1}, loanOut: false}]}},
  i18nFields() {}, EV(e) { player.push(e); }, MEV(e) { manager.push(e); },
  tr(t, p = {}) { return String(t).replace(/\{(\w+)\}/g, (_, k) => (p[k] == null ? `{${k}}` : p[k])); },
  plName(p) { return `Player ${p.id}`; }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('legacy-game/src/events-universo.js', 'utf8'), ctx, {filename: 'events-universo.js'});

/* Contextos reales de una carrera de Jugador/a y de Míster/club propio. */
const playerContext = (gender) => ({
  inSeason: true, teamGames: 5, gender, p: {fit: 48, inj: 2, age: 20, flags: {uvStudyPlan: 'remote', uvRehabPath: 'plan'}},
  last: {n: 5}, pl: ctx.S.m.sq[0]
});
const managerContext = (gender) => ({
  inSeason: true, teamGames: 5, gender, last: {n: 5}, pl: ctx.S.m.sq[0],
  p: {age: 20, flags: {}, fit: 50}, m: ctx.S.m
});

const groups = {
  player: player.filter((ev) => !ev.id.startsWith('uv_club_')),
  manager: manager.filter((ev) => !ev.id.startsWith('uv_club_')),
  club: manager.filter((ev) => ev.id.startsWith('uv_club_'))
};
const contextFor = {player: playerContext, manager: managerContext, club: managerContext};

/* Semilla determinista para que el informe sea reproducible. */
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/* Ritmo real del motor: 5 bloques por temporada, se decide entre bloques (4 veces),
   y con la dificultad normal se sortean 1–2 decisiones por hueco ([1,1,2] + 55 %). */
function twoSeasonOffers(mode, gender, seed) {
  const random = seeded(seed);
  const pool = groups[mode].filter((ev) => ev.when(contextFor[mode](gender)));
  const lastOffered = {};
  const unique = new Set();
  let offers = 0;
  for (let season = 0; season < 2; season++) {
    for (let block = 1; block <= 4; block++) {
      const slot = (season * 5) + block;
      let count = 2 + (random() < 0.55 ? 1 : 0);
      const available = pool.filter((ev) => lastOffered[ev.id] == null || slot - lastOffered[ev.id] >= (ev.cd || 3));
      const picked = [];
      while (count-- > 0 && picked.length < available.length) {
        /* Igual que el motor: el sesgo de novedad hace pesar más lo nunca ofrecido. */
        const weight = (ev) => (typeof ev.w === 'function' ? ev.w(contextFor[mode](gender)) : (ev.w || 1)) * (lastOffered[ev.id] == null ? 2.6 : 1);
        const total = available.reduce((sum, ev) => sum + (picked.includes(ev) ? 0 : weight(ev)), 0);
        let roll = random() * total;
        let chosen = available.find((ev) => !picked.includes(ev) && (roll -= weight(ev)) <= 0);
        if (!chosen) chosen = available.filter((ev) => !picked.includes(ev)).pop();
        if (!chosen) break;
        picked.push(chosen);
      }
      for (const ev of picked) {
        unique.add(ev.id);
        lastOffered[ev.id] = slot;
        offers++;
      }
    }
  }
  return {offers, unique: [...unique].sort(), pool: pool.map((ev) => ev.id)};
}

const report = {};
for (const mode of ['player', 'manager', 'club']) {
  report[mode] = {};
  for (const gender of ['f', 'm']) {
    const result = twoSeasonOffers(mode, gender, 20261027);
    report[mode][gender] = result;
    assert.ok(result.pool.length >= 30, `${mode}/${gender}: at least 30 relevant families in the pool (${result.pool.length})`);
    assert.equal(new Set(result.unique).size, result.unique.length, `${mode}/${gender}: unique ids only`);
    assert.ok(result.unique.length >= 10, `${mode}/${gender}: two seasons expose a representative sample (${result.unique.length})`);
    assert.ok(result.unique.every((id) => result.pool.includes(id)), `${mode}/${gender}: only eligible families appear`);
  }
  /* La elegibilidad no depende del género: el mismo catálogo y el mismo sorteo. */
  assert.deepEqual(report[mode].f.unique, report[mode].m.unique, `${mode}: women and men get the same offers`);
}
assert.equal(groups.player.length, 36, 'thirty-six player families');
assert.equal(groups.manager.length, 36, 'thirty-six manager families');
assert.equal(groups.club.length, 36, 'thirty-six created-club families');
assert.equal(new Set([...groups.player, ...manager].map((ev) => ev.id)).size, 108, '108 stable ids across the three modes');

const lines = [];
for (const mode of ['player', 'manager', 'club']) {
  const row = report[mode].f;
  lines.push(`${mode}: ${row.pool.length} pertinentes, ${row.offers} ofertas, ${row.unique.length} distintas en 2 temporadas`);
}
const summary = lines.join(' · ');
const exposure = Math.min(...['player', 'manager', 'club'].map((mode) => report[mode].f.unique.length));
const balance = {
  measured: '2026-10-27', pacing: '5 bloques por temporada, 4 huecos, 2–3 decisiones por hueco, dificultad normal, sesgo de novedad 2,6× para familias nunca vistas',
  families: {player: 36, manager: 36, club: 36},
  eligible: {player: report.player.f.pool.length, manager: report.manager.f.pool.length, club: report.club.f.pool.length},
  exposedInTwoSeasons: {player: report.player.f.unique.length, manager: report.manager.f.unique.length, club: report.club.f.unique.length},
  minimumExposure: exposure
};
fs.mkdirSync('real-f', {recursive: true});
fs.writeFileSync('real-f/decision-balance.json', JSON.stringify(balance, null, 2) + '\n');

assert.ok(exposure >= 10, 'the two-season sample is representative in every mode');
/* Guardia de implementación: los dos motores deben seguir aplicando el sesgo medido. */
const playerEngine = fs.readFileSync('legacy-game/src/engine-player.js', 'utf8');
const managerEngine = fs.readFileSync('legacy-game/src/events-manager.js', 'utf8');
assert.match(playerEngine, /function novelty\(lastSeen\) \{ return lastSeen == null \? 2\.6 : 1; \}/,
  'the player engine keeps the novelty bias');
assert.match(playerEngine, /novelty\(S\.p\.evCd\[e\.id\]\)/, 'the player engine feeds the bias from the saved cooldown');
assert.match(managerEngine, /m\.evCd\[e\.id\] == null \? 2\.6 : 1/, 'the manager engine applies the same bias');

/* Con el sesgo de novedad la exposición toca el techo del ritmo: casi todas las ofertas son
   familias distintas. Las 30 de dos temporadas exigirían más huecos, no un sorteo mejor. */
assert.ok(exposure >= 20, 'the novelty bias lifts the two-season exposure close to the offer ceiling');
assert.ok(exposure < 30, 'the measurement records that two seasons still do not show 30 different families');

console.log(`Decision balance report: ${summary}.`);
console.log('Decision balance tests passed: 30+ eligible families per mode and gender, gender-neutral offers, deterministic two-season sample and an explicit exposure report.');
